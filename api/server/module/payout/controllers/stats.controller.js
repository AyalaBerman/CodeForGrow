const _ = require('lodash');
const { Parser } = require('json2csv');
const excel = require('exceljs');
exports.balance = async (req, res, next) => {
  try {
    const tutorId = req.params.tutorId || req.user._id;
    const data = await Service.PayoutRequest.calculateCurrentBalance(tutorId);
    res.locals.balance = _.omit(data, ['transactionIds']);
    next();
  } catch (e) {
    next(e);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const options = req.query;
    if (req.user.role !== 'admin') {
      options.tutorId = req.user._id.toString();
    }

    res.locals.stats = await Service.PayoutRequest.stats(options);
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.statsEarningTutor = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['tutorId']
    });
    const sort = Helper.App.populateDBSort(req.query);
    if (req.query.tutorId) {
      query.tutorId = Helper.App.toObjectId(req.query.tutorId);
    }
    let stats = await DB.PayoutItem.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'users',
          localField: 'tutorId',
          foreignField: '_id',
          as: 'tutors'
        }
      },
      {
        $unwind: '$tutors'
      },
      {
        $group: {
          _id: {
            tutorId: '$tutorId',
            tutorName: '$tutors.name',
            tutorEmail: '$tutors.email',
            commissionRate: '$tutors.commissionRate'
          },
          totalAmountPayoutRequest: {
            $sum: '$total'
          },
          totalTutorTillDate: {
            $sum: '$balance'
          },
          paidTutorTillDate: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$balance', 0]
            }
          },
          balanceTutorDue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$balance', 0]
            }
          },
          totalAdminTillDate: {
            $sum: '$commission'
          },
          paidAdminTillDate: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$commission', 0]
            }
          },
          balanceAdminDue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$commission', 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          tutorId: '$_id.tutorId',
          totalAmountPayoutRequest: 1,
          totalTutorTillDate: 1,
          paidTutorTillDate: 1,
          balanceTutorDue: 1,
          totalAdminTillDate: 1,
          paidAdminTillDate: 1,
          balanceAdminDue: 1,
          tutorName: '$_id.tutorName',
          tutorEmail: '$_id.tutorEmail',
          commissionRate: {
            $multiply: ['$_id.commissionRate', 100]
          }
        }
      },
      { $sort: sort },
      { $skip: page * take },
      { $limit: take }
    ]);
    const count = await DB.PayoutItem.aggregate([
      {
        $group: {
          _id: '$tutorId'
        }
      },
      {
        $count: 'passing_scores'
      }
    ]);
    let commissionRate = process.env.COMMISSION_RATE;
    const config = await DB.Config.findOne({
      key: 'commissionRate'
    });
    if (config) {
      commissionRate = config.value;
    }
    if (stats && stats.length) {
      stats = await Promise.all(
        stats.map(async item => {
          const data = item;
          if (!data.commissionRate) {
            data.commissionRate = commissionRate * 100;
          }
          return data;
        })
      );
    }
    res.locals.statsEarningTutor = {
      items: stats,
      count: (count && count.length && count[0].passing_scores) || 0
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.statsEarningTutorDetail = async (req, res, next) => {
  try {
    const tutorId = req.params.tutorId;
    if (!tutorId) {
      return next(
        PopulateResponse.error({
          message: 'Missing params'
        })
      );
    }
    let stats = await DB.PayoutItem.aggregate([
      { $match: { tutorId: Helper.App.toObjectId(tutorId) } },
      {
        $group: {
          _id: '$tutorId',
          totalAmountPayoutRequest: {
            $sum: '$total'
          },
          totalTutorTillDate: {
            $sum: '$balance'
          },
          paidTutorTillDate: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$balance', 0]
            }
          },
          balanceTutorDue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$balance', 0]
            }
          },
          totalAdminTillDate: {
            $sum: '$commission'
          },
          paidAdminTillDate: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$commission', 0]
            }
          },
          balanceAdminDue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$commission', 0]
            }
          }
        }
      }
    ]);
    let commissionRate = process.env.COMMISSION_RATE;
    const config = await DB.Config.findOne({
      key: 'commissionRate'
    });
    if (config) {
      commissionRate = config.value;
    }
    if (stats && stats.length) {
      stats = await Promise.all(
        stats.map(async item => {
          const data = item;
          if (item._id) {
            const tutor = await DB.User.findOne({ _id: item._id });
            if (tutor) {
              data.tutor = tutor;
              data.commissionRate = tutor.commissionRate ? tutor.commissionRate * 100 : commissionRate * 100;
            }
          }
          return data;
        })
      );
    }
    const data = stats && stats.length ? stats[0] : null;
    res.locals.statDetail = data;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.exportEarnings = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['tutorId']
    });
    const sort = Helper.App.populateDBSort(req.query);
    if (req.query.tutorId) {
      query.tutorId = Helper.App.toObjectId(req.query.tutorId);
    }
    const type = req.params.type;
    let stats = await DB.PayoutItem.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$tutorId',
          totalAmountPayoutRequest: {
            $sum: '$total'
          },
          totalTutorTillDate: {
            $sum: '$balance'
          },
          paidTutorTillDate: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$balance', 0]
            }
          },
          balanceTutorDue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$balance', 0]
            }
          },
          totalAdminTillDate: {
            $sum: '$commission'
          },
          paidAdminTillDate: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$commission', 0]
            }
          },
          balanceAdminDue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$commission', 0]
            }
          }
        }
      },
      { $skip: page * take },
      { $limit: take },
      { $sort: sort }
    ]);
    const count = await DB.PayoutItem.aggregate([
      {
        $group: {
          _id: '$tutorId'
        }
      },
      {
        $count: 'passing_scores'
      }
    ]);
    let commissionRate = process.env.COMMISSION_RATE;
    const config = await DB.Config.findOne({
      key: 'commissionRate'
    });
    if (config) {
      commissionRate = config.value;
    }
    if (stats && stats.length) {
      stats = await Promise.all(
        stats.map(async item => {
          const data = item;
          if (item._id) {
            const tutor = await DB.User.findOne({ _id: item._id });
            if (tutor) {
              data.tutor = tutor;
              data.tutorName = tutor.name;
              data.tutorEmail = tutor.email;
              data.commissionRate = tutor.commissionRate ? tutor.commissionRate * 100 : commissionRate * 100;
            }
          }
          return data;
        })
      );
    }
    if (type === 'csv') {
      const fields = [
        {
          label: 'Tutor name',
          value: 'tutor.name'
        },
        {
          label: 'Tutor email',
          value: 'tutor.email'
        },
        {
          label: 'Admin commission',
          value: 'commissionRate'
        },
        {
          label: 'Total amount requested for payment',
          value: 'totalAmountPayoutRequest'
        },
        {
          label: 'Tutor - total till date',
          value: 'totalTutorTillDate'
        },
        {
          label: 'Tutor - paid till date',
          value: 'paidTutorTillDate'
        },
        {
          label: 'Tutor - balance due',
          value: 'balanceTutorDue'
        },
        {
          label: 'Admin - total till date',
          value: 'totalAdminTillDate'
        },
        {
          label: 'Admin - paid till date',
          value: 'paidAdminTillDate'
        },
        {
          label: 'Admin - balance due',
          value: 'balanceAdminDue'
        }
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(stats);

      res.attachment('earnings.csv');
      return res.status(200).send(csv);
    } else if (type === 'excel') {
      let workbook = new excel.Workbook();
      let worksheet = workbook.addWorksheet('Tutor earnings', { properties: { tabColor: { argb: 'FFC0000' } } });
      worksheet.columns = [
        {
          header: 'Tutor name',
          key: 'tutorName',
          width: 25
        },
        {
          header: 'Tutor email',
          key: 'tutorEmail',
          width: 25
        },
        {
          header: 'Admin commission (%)',
          key: 'commissionRate',
          width: 25
        },
        {
          header: 'Total amount requested for payment',
          key: 'totalAmountPayoutRequest',
          width: 25
        },
        {
          header: 'Tutor - total till date',
          key: 'totalTutorTillDate',
          width: 25
        },
        {
          header: 'Tutor - paid till date',
          key: 'paidTutorTillDate',
          width: 25
        },
        {
          header: 'Tutor - balance due',
          key: 'balanceTutorDue',
          width: 25
        },
        {
          header: 'Admin - total till date',
          key: 'totalAdminTillDate',
          width: 25
        },
        {
          header: 'Admin - paid till date',
          key: 'paidAdminTillDate',
          width: 25
        },
        {
          header: 'Admin - balance due',
          key: 'balanceAdminDue',
          width: 25
        }
      ];

      // Add Array Rows
      worksheet.addRows(stats);
      worksheet.eachRow(function (row, rowNumber) {
        row.eachCell((cell, colNumber) => {
          if (rowNumber == 1) {
            // First set the background of header row
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'f5b914' }
            };
          }
          // Set border of each cell
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        //Commit the changed row to the stream
        row.commit();
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=' + 'earnings.xlsx');

      return workbook.xlsx.write(res).then(function () {
        res.status(200).end();
      });
    }
  } catch (e) {
    return next(e);
  }
};

exports.exportPayoutRequestList = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['type', 'tutorId', 'status'],
      text: ['code']
    });
    const sort = Helper.App.populateDBSort(req.query);

    if (req.query.startDate && req.query.toDate) {
      query.createdAt = {
        $gte: moment(req.query.startDate).toDate(),
        $lte: moment(req.query.toDate).add(1, 'days').toDate()
      };
    }

    const type = req.params.type;

    let items = await DB.PayoutRequest.find(query)
      .populate('tutor')
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    if (items && items.length) {
      items = items.map(item => {
        const data = item.toObject();
        data.tutorName = data.tutor.name;
        return data;
      });
    }

    if (type === 'csv') {
      const fields = [
        {
          label: 'Code',
          value: 'code'
        },
        {
          label: 'Tutor name',
          value: 'tutor.name'
        },
        {
          label: 'Total',
          value: 'total'
        },
        {
          label: 'Commission',
          value: 'commission'
        },
        {
          label: 'Tutor balance',
          value: 'balance'
        },
        {
          label: 'Status',
          value: 'status'
        },
        {
          label: 'Created on',
          value: 'createdAt'
        }
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(items);

      res.attachment('payout-request.csv');
      return res.status(200).send(csv);
    } else if (type === 'excel') {
      let workbook = new excel.Workbook();
      let worksheet = workbook.addWorksheet('Payout requests', { properties: { tabColor: { argb: 'FFC0000' } } });
      worksheet.columns = [
        {
          header: 'Code',
          key: 'code',
          width: 25
        },
        {
          header: 'Tutor name',
          key: 'tutorName',
          width: 25
        },
        {
          header: 'Total',
          key: 'total',
          width: 25
        },
        {
          header: 'Commission',
          key: 'commission',
          width: 25
        },
        {
          header: 'Tutor balance',
          key: 'balance',
          width: 25
        },
        {
          header: 'Status',
          key: 'status',
          width: 25
        },
        {
          header: 'Created on ',
          key: 'createdAt',
          width: 25
        }
      ];

      // Add Array Rows
      worksheet.addRows(items);
      worksheet.eachRow(function (row, rowNumber) {
        row.eachCell((cell, colNumber) => {
          if (rowNumber == 1) {
            // First set the background of header row
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'f5b914' }
            };
          }
          // Set border of each cell
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        //Commit the changed row to the stream
        row.commit();
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=' + 'payout-request.xlsx');

      return workbook.xlsx.write(res).then(function () {
        res.status(200).end();
      });
    }
  } catch (e) {
    return next(e);
  }
};

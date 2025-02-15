const Joi = require('joi');
const moment = require('moment');
const _ = require('lodash');
const availableTimeWebinarQ = require('../available-time-queue');
const availableTimeTutorQ = require('../../tutor/available-time-queue');
const { PLATFORM_ONLINE } = require('../../meeting');

const validateSchema = Joi.object().keys({
  name: Joi.string().required(),
  maximumStrength: Joi.number().required().min(1),
  categoryIds: Joi.array().items(Joi.string()).optional(),
  mediaIds: Joi.array().items(Joi.string()).allow([null, '']).optional(),
  isOpen: Joi.boolean().allow(null, '').optional(),
  price: Joi.number().required(),
  description: Joi.string().allow([null, '']).optional(),
  mainImageId: Joi.string().required(),
  hashWebinar: Joi.string().allow([null, '']).optional(),
  featured: Joi.boolean().allow([null]).optional(),
  alias: Joi.string().allow([null, '']).optional(),
  tutorId: Joi.string().allow([null, '']).optional(),
  isFree: Joi.boolean().allow(null, '').optional(),
  gradeIds: Joi.array().items(Joi.string()).optional(),
  subjectIds: Joi.array().min(1).items(Joi.string()).required(),
  topicIds: Joi.array().min(1).items(Joi.string()).required(),
  age: Joi.object().keys({
    from: Joi.number(),
    to: Joi.number()
  })
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.webinarId || req.body.webinarId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = Helper.App.isMongoId(id) ? { _id: id } : { alias: id };
    let webinar = await DB.Webinar.findOne(query, { availableTimeRange: 0, slotIds: 0, hashWebinar: 0 })
      .populate({ path: 'tutor', select: 'name avatarUrl username country featured ratingAvg totalRating avatar bio completedByLearner' })
      .populate({ path: 'categories', select: '_id name alias' })
      .populate({ path: 'subjects', select: '_id name alias' })
      .populate({ path: 'topics', select: '_id name alias' })
      .populate({ path: 'mainImage', select: '_id name filePath thumbPath fileUrl thumbUrl convertStatus uploaded' })
      .populate({
        path: 'coupon',
        select: '_id value type'
      })
      .populate('media')
      .populate({ path: 'grades', select: '_id name' });
    if (!webinar) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    if (!req.user || (req.user && req.user.type === 'user' && req.user.role !== 'admin')) {
      webinar.media = [];
    }
    const data = webinar.toObject();
    data.isFavorite = false;
    if (req.user) {
      const favorite = await DB.Favorite.findOne({ userId: req.user._id, webinarId: webinar._id });
      if (favorite) {
        data.isFavorite = true;
      }

      data.booked = false;
      const booked = await DB.Transaction.count({
        targetId: webinar._id,
        paid: true,
        targetType: 'webinar',
        $or: [{ userId: req.user._id }, { idRecipient: req.user._id }]
      });
      // Check if the appointment has expired, then the user can rebook.
      const pendingAppointment = await DB.Appointment.count({
        status: {
          $in: ['pending', 'booked', 'progressing']
        },
        paid: true,
        webinarId: webinar._id,
        $or: [{ userId: req.user._id }, { idRecipient: req.user._id }]
      });
      data.booked = booked && pendingAppointment ? true : false;
      if (req.user._id.toString() === webinar.tutorId.toString()) {
        data.canUpdate = await Service.Webinar.canUpdateWebinar(webinar._id);
      }
    }

    req.webinar = webinar;
    res.locals.webinar = data;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;
  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name'],
      boolean: ['featured', 'disabled']
    });
    if (req.query.tutorId) {
      query.tutorId = req.query.tutorId;
    }
    if (req.query.categoryIds) {
      const categoryIds = req.query.categoryIds.split(',');
      query.categoryIds = { $in: categoryIds };
    }
    if (req.query.subjectIds) {
      const subjectIds = req.query.subjectIds.split(',');
      query.subjectIds = { $in: subjectIds };
    }
    if (req.query.topicIds) {
      const topicIds = req.query.topicIds.split(',');
      query.topicIds = { $in: topicIds };
    }
    if (req.query.gradeIds) {
      const gradeIds = req.query.gradeIds.split(',');
      query.gradeIds = { $in: gradeIds };
    }
    if (req.query.isOpen) {
      query.isOpen = req.query.isOpen;
    }
    if (req.query.isAvailable) {
      query.lastDate = { $gt: new Date().toISOString() };
    }
    if (req.query.startTime && req.query.toTime) {
      query.availableTimeRange = {
        $elemMatch: {
          startTime: { $gte: req.query.startTime, $lte: req.query.toTime }
        }
      };
    }

    if (!req.query.tutorName) req.query.tutorName = '';
    if (req.query.age) {
      const ageFilter = JSON.parse(req.query.age);
      query.$or = [
        {
          'age.from': {
            $gte: ageFilter.from,
            $lte: ageFilter.to
          }
        },
        {
          'age.from': {
            $gte: ageFilter.from
          },
          'age.to': {
            $lte: ageFilter.to
          }
        },
        {
          'age.from': {
            $lte: ageFilter.from
          },
          'age.to': {
            $gte: ageFilter.to
          }
        },
        {
          'age.to': {
            $gte: ageFilter.from,
            $lte: ageFilter.to
          }
        }
      ];
    }
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Webinar.count(query);
    let items = await DB.Webinar.find(query, { availableTimeRange: 0, slotIds: 0, hashWebinar: 0 })
      .populate({
        path: 'tutor',
        match: { name: { $regex: req.query.tutorName, $options: 'i' } },
        select: 'name avatarUrl username country featured ratingAvg totalRating avatar '
      })
      .populate({ path: 'categories', select: '_id name alias' })
      .populate({ path: 'mainImage', select: '_id name filePath thumbPath fileUrl thumbUrl convertStatus uploaded' })
      .populate({ path: 'firstSlot', options: { limit: 1, sort: { startTime: 1 } } })
      .populate('coupon')
      .populate({ path: 'grades', select: '_id name' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    if (req.user) {
      items = await Promise.all(
        items.map(async item => {
          const data = item.toObject();
          const favorite = await DB.Favorite.count({
            userId: req.user._id,
            webinarId: item._id
          });
          data.isFavorite = favorite ? true : false;

          // Check user has enrolled webinar
          const booked = await DB.Transaction.count({
            targetId: item._id,
            type: 'booking',
            paid: true,
            $or: [{ userId: req.user._id }, { idRecipient: req.user._id }]
          });

          // Check if the appointment has expired, then the user can rebook.
          const pendingAppointment = await DB.Appointment.count({
            status: {
              $in: ['pending', 'booked', 'progressing']
            },
            paid: true,
            webinarId: item._id,
            $or: [{ userId: req.user._id }, { idRecipient: req.user._id }]
          });

          data.booked = booked && pendingAppointment ? true : false;
          return data;
        })
      );
    }
    res.locals.list = { count, items };
    next();
  } catch (e) {
    console.log(e);
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    if (req.user.type === 'student' || req.user.type === 'parent') {
      return next(PopulateResponse.error({ message: 'You are not authorized' }));
    }
    const tutorId = req.user.role === 'admin' && req.body.tutorId ? req.body.tutorId : req.user._id;
    const tutor = await DB.User.findOne({ _id: tutorId });
    if (!tutor) {
      return next(PopulateResponse.error({ message: 'Can not found the tutor!' }));
    }
    const isZoomPlatform = await Service.Meeting.isPlatform(PLATFORM_ONLINE.ZOOM_US);

    if (!tutor.isZoomAccount && isZoomPlatform) {
      return next(PopulateResponse.error({ message: 'Tutor is not active on zoom!' }));
    }
    let hashWebinar = validate.value.hashWebinar || null;
    if (!hashWebinar) {
      return next(PopulateResponse.error({ message: 'Please add schedule for webinar' }));
    }
    let alias = req.body.alias ? Helper.String.createAlias(req.body.alias) : Helper.String.createAlias(req.body.name);
    const count = await DB.Webinar.count({ alias });
    if (count) {
      alias = `${alias}-${Helper.String.randomString(5)}`;
    }
    const webinar = new DB.Webinar(
      Object.assign(_.omit(validate.value, 'hashWebinar'), {
        tutorId,
        isOpen: true,
        alias
      })
    );
    const schedules = await DB.Schedule.find({ hashWebinar: hashWebinar }).sort({ startTime: -1 });
    if (!schedules.length) {
      return next(PopulateResponse.error({ message: 'Please add schedule for webinar' }));
    }
    await Promise.all(
      schedules.map(async item => {
        item.webinarId = webinar._id;
        item.hashWebinar = null;
        await item.save();
        await availableTimeWebinarQ.addAvailableTime(item);
        await availableTimeTutorQ.addAvailableTime(item);
      })
    );
    webinar.lastSlot = schedules[0];
    webinar.lastDate = schedules[0].startTime;
    await webinar.save();
    if (webinar.categoryIds && webinar.categoryIds.length) {
      await DB.User.update(
        {
          _id: webinar.tutorId
        },
        { $addToSet: { categoryIds: { $each: webinar.categoryIds } } }
      );
    }
    res.locals.create = webinar;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    if (req.user.type === 'student' || req.user.type === 'parent') {
      return next(PopulateResponse.error({ message: 'You are not authorized' }));
    }

    if (req.webinar.tutorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(404).send(
        PopulateResponse.error({
          message: 'You are not the creator of this webinar'
        })
      );
    }
    let alias = validate.value.alias ? Helper.String.createAlias(validate.value.alias) : Helper.String.createAlias(validate.value.name);
    const count = await DB.Webinar.count({
      alias,
      _id: { $ne: req.webinar._id }
    });
    if (count) {
      alias = `${alias}-${Helper.String.randomString(5)}`;
    }
    Object.assign(req.webinar, validate.value, { alias });
    await req.webinar.save();
    if (req.webinar.categoryIds && req.webinar.categoryIds.length) {
      await DB.User.update(
        {
          _id: req.webinar.tutorId
        },
        { $addToSet: { categoryIds: { $each: req.webinar.categoryIds } } }
      );
    }
    res.locals.update = req.webinar;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.webinar.tutorId.toString() !== req.user._id.toString()) {
      return res.status(404).send(
        PopulateResponse.error({
          message: 'You are not the creator of this webinar'
        })
      );
    }
    const appointments = await DB.Appointment.count({
      paid: true,
      webinarId: req.webinar._id,
      status: { $nin: ['canceled', 'not-start'] }
    });
    if (appointments) {
      return next(
        PopulateResponse.error({
          message: 'Can not delete,already have users enrolled this webinar'
        })
      );
    }
    await req.webinar.remove();
    if (req.webinar.categoryIds && req.webinar.categoryIds.length) {
      await DB.User.update(
        {
          _id: req.webinar.tutorId
        },
        { $pull: { categoryIds: { $in: req.webinar.categoryIds } } }
      );
    }
    const schedules = await DB.Schedule.find({
      webinarId: req.webinar._id
    });
    if (schedules && schedules.length) {
      await Promise.all(
        schedules.map(async item => {
          await item.remove();
          await availableTimeWebinarQ.removeAvailableTime(item);
          await availableTimeTutorQ.removeAvailableTime(item);
        })
      );
    }
    res.locals.remove = {
      message: 'Webinar is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.enrolledUsers = async (req, res, next) => {
  try {
    const id = req.params.webinarId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = { targetId: id, paid: true, targetType: 'webinar' };
    const sort = Helper.App.populateDBSort(query);
    const count = await DB.Transaction.count(query);
    const items = await DB.Transaction.find(query).populate({ path: 'user', select: ' -_id name avatarUrl avatar' }).sort(sort).exec();
    res.locals.enrolled = { count, items };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const canChangeStatus = req.user.role === 'admin' || (req.user.type === 'tutor' && req.user._id.toString() === req.webinar.tutorId.toString());
    if (!canChangeStatus) return next(PopulateResponse.forbidden());
    req.webinar.disabled = !req.webinar.disabled;
    await req.webinar.save();
    if (req.webinar.disabled) {
      const tutor = await DB.User.findOne({ _id: req.webinar.tutorId });
      await Service.Mailer.send('admin-disable-groupclass', tutor.email, {
        subject: `Admin disabled your groupclass`,
        tutor: tutor.toObject(),
        appName: process.env.APP_NAME,
        adminEmail: process.env.ADMIN_EMAIL,
        webinar: req.webinar.toObject()
      });
    }
    res.locals.changeStatus = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.getLatestSlot = async (req, res, next) => {
  try {
    const schedules = await DB.Schedule.find({
      webinarId: req.params.id,
      startTime: {
        $gt: moment().add(30, 'minutes').toDate()
      }
    }).sort({ startTime: -1 });
    const webinar = await DB.Webinar.findOne({ _id: req.params.id });
    const latest = schedules[schedules.length - 1] || webinar.lastSlot;
    res.locals.latest = { latest };
    next();
  } catch (e) {
    next(e);
  }
};

exports.removeDocument = async (req, res, next) => {
  try {
    const id = req.params.webinarId;
    const documentId = req.params.documentId;
    if (!id || !documentId) {
      return next(PopulateResponse.error({ message: 'Missing params' }));
    }
    const removedFile = await Service.Media.removeFile(documentId);
    const webinar = await DB.Webinar.findOne({ _id: id });
    if (!webinar) {
      return next(PopulateResponse.notFound());
    }
    if (removedFile) {
      await DB.Webinar.updateOne(
        {
          _id: webinar._id
        },
        {
          $pull: { mediaIds: documentId }
        }
      );
    }
    res.locals.remove = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(
        PopulateResponse.error(
          {
            message: 'Missing document'
          },
          'ERR_MISSING_FILE'
        )
      );
    }

    const file = await Service.Media.createFile({
      value: { systemType: 'document' },
      file: req.file,
      user: req.user
    });
    if (req.webinar && file) {
      await DB.Webinar.update(
        {
          _id: req.webinar._id
        },
        { $addToSet: { mediaIds: { $each: [file._id] } } }
      );
    }

    const enrolled = await DB.Transaction.find({
      targetId: req.webinar._id,
      paid: true,
      status: {
        $in: ['completed', 'pending-refund']
      },
      type: 'booking'
    });
    if (enrolled && enrolled.length > 0) {
      for (const e of enrolled) {
        const user = await DB.User.findOne({ _id: e.userId });
        const tutor = await DB.User.findOne({ _id: e.tutorId });
        if (user && tutor)
          await Service.Mailer.send('material-groupclass-uploaded-to-user', user.email, {
            subject: 'New groupclass material uploaded',
            user: user.getPublicProfile(),
            tutor: tutor.getPublicProfile(),
            title: 'New Material Uploaded!',
            webinar: req.webinar.toObject()
          });
      }
    }

    res.locals.upload = file;
    return next();
  } catch (e) {
    return next(e);
  }
};

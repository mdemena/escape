'use strict';
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
const Event = require('../models/Event');

const { requireUser, requireFields } = require('../middlewares/index');

/* GET users listing. */

router.get('/list', requireUser, async (req, res, next) => {
  try {
    const event = await Event.find().populate('escapeRoom users creator');
    res.render('events/list', { event });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/create', requireUser, (req, res, next) => {
  const dato = {
    messages: req.flash('check')
  };
  const { id } = req.params;
  const { _id } = req.session.currentUser;

  res.render('events/create', { id, _id, dato });
});

router.post('/:id/create', requireFields, requireUser, async (req, res, next) => {
  const { escapeRoom, showtime, inputDate } = req.body;
  const date = moment(new Date(`${inputDate}`)).format('ll');
  const event = {
    escapeRoom,
    date,
    showtime
  };
  try {
    event.creator = req.session.currentUser._id;
    event.players = [req.session.currentUser._id];
    await Event.create(event);
    res.redirect('/events/list');
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireUser, async (req, res, next) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id).populate('creator escapeRoom players');
    const rest = event.escapeRoom.capacity.maxPlayers - event.players.length;
    res.render('events/detail', { event, rest });
  } catch (error) {
    next(error);
  }
});

router.post('/:id', requireUser, async (req, res, next) => {
  const { id } = req.params;
  const { _id } = req.session.currentUser;
  const event = await Event.findById(id).populate('creator escapeRoom players users');
  try {
    if (event.players.length < event.escapeRoom.capacity.maxPlayers) {
      await Event.findByIdAndUpdate(id, { $push: { 'players': { _id } } });
    }
    res.redirect('/events/' + id);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/delete', requireUser, async (req, res, next) => {
  const { id } = req.params;
  const { _id } = req.session.currentUser;
  try {
    const userID = mongoose.mongo.ObjectID(_id);
    await Event.findByIdAndUpdate(id, { $pull: { 'players': userID } });
    res.redirect('/events/' + id);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Hoot = require('../models/hoot.js');
const router = express.Router();

// ========== Public Routes ===========

// ========= Protected Routes =========

router.use(verifyToken);

router.post('/', async (req, res) => {
  try {
    req.body.author = req.user._id;
    const hoot = await Hoot.create(req.body);
    hoot._doc.author = req.user;
    res.status(201).json(hoot);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
})

router.get('/', async (req, res) => {
    try {
        const hoots = await Hoot.find({}).populate('author').sort({ createdAt: 'desc' })
        res.status(200).json(hoots)
    } catch (err) {
        res.status(500).json(err)
    }
})

router.get('/:hootId', async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId).populate('author')
        res.status(200).json(hoot)
    } catch (err) {
        res.status(500).json(err)
    }
})

router.put('/:hootId', async (req, res) => {
    try {
        //find the hoot 
        const hoot = await Hoot.findById(req.params.hootId)
        //check permissions
        if (!hoot.author.equals(req.user._id)) {
          return res.status(403).send("You're not allowed to do that!")
        }
        //update hoot
        const updatedHoot = await Hoot.findByIdAndUpdate(
            req.params.hootId,
            req.body,
            { new: true }
        ) 
        updatedHoot._doc.author = req.user
        res.status(200).json(updatedHoot)
    } catch (err) {
        res.status(500).json(err)
    }
})

router.delete('/:hootId', async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId)

        if (!hoot.author.equals(req.user._id)) {
          return res.status(403).send("You're not allowed to do that!")
        }
    
        const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId)
        res.status(200).json(deletedHoot)
        } catch (err) {
        res.status(500).json(err)
    }
})

router.post('/:hootId/comments', async (req, res) => {
    try {
        req.body.author = req.user._id
        const hoot = await Hoot.findById(req.params.hootId)
        hoot.comments.push(req.body)
        await hoot.save()

        // Find the newly created comment:
        const newComment = hoot.comments[hoot.comments.length - 1]
    
        newComment._doc.author = req.user
    
        // Respond with the newComment:
        res.status(201).json(newComment)
      } catch (error) {
        res.status(500).json(error)
      }
})

router.put('/:hootId/comments/:commentId', async (req, res) => {
    try {
      const hoot = await Hoot.findById(req.params.hootId)
      const comment = hoot.comments.id(req.params.commentId)
      comment.text = req.body.text
      await hoot.save()
      res.status(200).json(hoot)
    } catch (err) {
      res.status(500).json(err)
    }
  });

router.delete('/:hootId/comments/:commentId', async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId)
        hoot.comments.remove({_id: req.params.commentId})
        await hoot.save()
        res.status(200).json({ message: 'ok' })
    } catch (err) {
        res.status(500).json(err)
    }
})

module.exports = router;
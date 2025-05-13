const BookNow = require('../model/booknow');

// CREATE Book Now popup
const createBookNow = async (req, res) => {
    console.log(req.user);
  try {
    const { name, items } = req.body;
    const userId = req.user.id;

    const existing = await BookNow.findOne({ name, userId });
    if (existing) {
      return res.status(400).json({ message: 'Book Now with this name already exists for this user.' });
    }

    const bookNow = new BookNow({ name, items, userId });
    await bookNow.save();
    res.status(201).json(bookNow);
  } catch (error) {
    res.status(500).json({ message: 'Error creating Book Now', error });
  }
};

// GET Book Now by name or all for user
const getBookNow = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.query;

    if (name) {
      const bookNow = await BookNow.findOne({ name, userId });
      return res.status(200).json(bookNow);
    }

    const all = await BookNow.find({ userId });
    res.status(200).json(all);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Book Now data', error });
  }
};

// UPDATE Book Now by name
const updateBookNow = async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.user.id;
    const updatedData = req.body;

    const updated = await BookNow.findOneAndUpdate(
      { name, userId },
      updatedData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Book Now not found' });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating Book Now', error });
  }
};

// DELETE Book Now by name
const deleteBookNow = async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.user.id;

    const deleted = await BookNow.findOneAndDelete({ name, userId });
    if (!deleted) return res.status(404).json({ message: 'Book Now not found' });

    res.status(200).json({ message: 'Book Now deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting Book Now', error });
  }
};

module.exports = {
  createBookNow,
  getBookNow,
  updateBookNow,
  deleteBookNow
};

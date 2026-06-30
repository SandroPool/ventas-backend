const parseId = (req) => {
    const { id } = req.params;
    return parseInt(id, 10);
};

module.exports = { parseId };

class APIFeatures {
  constructor(model, queryStr) {
    // prepare query

    this.model = model;
    this.query = '';
    this.queryStr = queryStr;
  }

  filter(opt) {
    const queryObj = {
      ...this.queryStr,
    };
    const exculedFields = ['page', 'sort', 'limit', 'fields'];
    exculedFields.forEach((el) => delete queryObj[el]);
    const filtersQueryStr = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );
    this.query = this.model.find(JSON.parse(filtersQueryStr));
    if (opt) {
      this.query = this.query.find(opt);
    }
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // default sort by created first
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields
        .split(',')
        .filter((field) => field.trim() !== 'password')
        .join(' ');
      this.query = this.query.select(fields);
    } else {
      // exclude __v field
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = +this.queryStr.page || 1;
    const limit = +this.queryStr.limit || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;

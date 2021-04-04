class APIFeatures {
  constructor(queryString, query) {
    this.query = query
    this.queryString = queryString
  }
  filter() {
    const queryObj = { ...this.queryString }
    const excludedFields = ['page', 'sort', 'limit', 'fields']
    excludedFields.forEach((el) => delete queryObj[el])

    // ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)
    this.query = this.query.find(JSON.parse(queryStr))

    return this
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ')
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort('-createdAt')
    }
    return this
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ')
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select('-__v')
    }
    return this
  }
  paginate() {
    const page = Number(this.queryString.page) || 1
    const limit = Number(this.queryString.limit) || 20
    const skip = (page - 1) * limit

    this.query = this.query.limit(limit).skip(skip)
    return this
  }
}

module.exports = APIFeatures

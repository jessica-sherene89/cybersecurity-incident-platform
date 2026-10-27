const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found - [${req.method}] ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `An account or record with that ${field} already exists.`;
  }

  // Handle Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with specified ID: ${err.value}`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle Multer upload error
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };

// middlewares/error.middleware.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  // Ye console log sirf debugging ke liye hai
  console.error("Error: ", err);

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
};

export default errorHandler;

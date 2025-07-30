import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
// import { decryptAESKey, decryptDataAES } from "../utils/decrypt.js";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { log } from "console";

const RSA_PRIVATE_KEY_PATH = path.resolve("keys/private.pem");
const iv = Buffer.alloc(16, 0);


//  function decryptAESKey(encryptedKeyBase64) {
//   const privateKey = fs.readFileSync(RSA_PRIVATE_KEY_PATH, "utf8");
//   const encryptedBuffer = Buffer.from(encryptedKeyBase64, "base64");
//   // Output should be hex string!
//   const decryptedHex = crypto.privateDecrypt(
//     {
//       key: privateKey,
//       padding: crypto.constants.RSA_PKCS1_PADDING,
//     },
//     encryptedBuffer
//   ).toString('utf8');  // because jsencrypt by default outputs utf8 string

//   return Buffer.from(decryptedHex, 'hex');
// }

function decryptAESKey(encryptedKeyBase64) {
  const privateKey = fs.readFileSync(RSA_PRIVATE_KEY_PATH, "utf8");
  const encryptedBuffer = Buffer.from(encryptedKeyBase64, "base64");
  console.log("encryptedBuffer length:", encryptedBuffer.length); // 256 for 2048-bit RSA
  try {
    const decryptedHex = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      encryptedBuffer
    ).toString('utf8');

    console.log("decryptedHex (aes key hex):", decryptedHex);
    return Buffer.from(decryptedHex, 'hex');
  } catch (e) {
    console.error("privateDecrypt error:", e);
    throw e;
  }
}


 function decryptDataAES(encryptedDataBase64, aesKeyBuffer) {
  const encryptedData = Buffer.from(encryptedDataBase64, "base64");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    aesKeyBuffer,
    iv
  );
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}




const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // user.refreshToken
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generate token");
  }
};

// const generateAccessandRefreshTokens = async (userId) => {
//     try {
//         const user = await User.findById(userId);

//         const accessToken = user.generateAccessToken();
//         const refreshToken = user.generateRefreshToken();

//         user.refreshToken = refreshToken; // ✅ important
//         await user.save({ validateBeforeSave: false });

//         return { accessToken, refreshToken };

//     } catch (error) {
//         console.error("Token Generation Error:", error);
//         throw new ApiError(500, "Something went wrong while generating tokens");
//     }
// };

// const registerUser = asyncHandler(async (req, res) => {
//   // get user details from frontend
//   //validation - non empty
//   //check if user already exist : username , email
//   // check for images ,check for avatar
//   //upload them to cloudinary , avatar
//   // create user object - create entry in db
//   // remove password and refresh token field from response
//   // check for user creation
//   //return response

//   const { fullname, email, username, password } = req.body;

//   console.log("Fields received:", { fullname, email, username, password });

//   if (
//     [fullname, email, password, username].some((fields) => fields.trim() === "")
//   ) {
//     throw new ApiError(400, "All fields are required");
//   }

//   const existedUser = await User.findOne({
//     $or: [{ username }, { email }],
//   });

//   if (existedUser) {
//     throw new ApiError(409, "User with email or Username Alresdy exist");
//   }

//   const avatarLocalPath = req.files?.avatar[0]?.path;
//   //    const coverImageLocalPath = req.files?.coverImage[0]?.path;
//   let coverImageLocalPath;
//   if (
//     req.files &&
//     Array.isArray(req.files.coverImage) &&
//     req.files.coverImage.length > 0
//   ) {
//     coverImageLocalPath = req.files.coverImage[0].path;
//   }

//   if (!avatarLocalPath) {
//     throw new ApiError(400, "Avatar is required");
//   }

//   const avatar = await uploadOnCloudinary(avatarLocalPath);
//   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

//   if (!avatar) {
//     throw new ApiError(400, "Avatar file is required");
//   }

//   const user = await User.create({
//     fullname,
//     avatar: avatar.url,
//     coverImage: coverImage?.url || "",
//     email,
//     password,
//     username: username.toLowerCase(),
//   });

//   const createdUser = await User.findById(user._id).select(
//     "-password -refreshToken"
//   );
//   if (!createdUser) {
//     throw new ApiError(500, "Something went wrong while registering the user ");
//   }

//   return res
//     .status(201)
//     .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
// });






const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  console.log("Fields received:", { fullname, email, username, password });

  // Validate required fields
  if ([fullname, email, password, username].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or Username already exists");
  }

  // Get avatar buffer from multer memoryStorage
  const avatarBuffer = req.files?.avatar?.[0]?.buffer;
  if (!avatarBuffer) {
    throw new ApiError(400, "Avatar is required");
  }

  // Optional cover image buffer
  let coverImageBuffer = null;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageBuffer = req.files.coverImage[0].buffer;
  }

  // Upload images to Cloudinary
  const avatar = await uploadOnCloudinary(avatarBuffer);
  const coverImage = coverImageBuffer ? await uploadOnCloudinary(coverImageBuffer) : null;

  if (!avatar?.url) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // Create user in DB
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // Retrieve user excluding sensitive fields
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Send response
  return res
    .status(201)
    .json({
      success: true,
      data: createdUser,
      message: "User Registered Successfully",
    });
});











// const loginUser = asyncHandler(async (req, res) => {
//   //req body -> data
//   //username or email
//   //find the user
//   //password check
//   //access and refresh token
//   // send cookies

//   const { email, username, password } = req.body;
//   //  if (!username || !email)
//   if (!(username || email)) {
//     throw new ApiError(400, "Username or email is required");
//   }
//         //  console.log(user, "login user");
         
//   const user = await User.findOne({
//     $or: [{ username }, { email }],
//   }).select("+password");

//   if (!user) {
//     throw new ApiError(404, "User does not exist");
//   }

//   const isPasswordValid = await user.isPasswordCorrect(password);
//   if (!isPasswordValid) {
//     throw new ApiError(404, "Invalid user Credentials");
//   }

//   const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
//     user._id
//   );

//   const loggedInUser = await User.findById(user._id).select(
//     "-password -refreshToken"
//   );

//   const options = {
//     httpOnly: true,
//     secure: true,
//     sameSite: "None",
//   };
//   return res
//     .status(200)
//     .cookie("accessToken", accessToken, options)
//     .cookie("refreshToken", refreshToken, options)
//     .json(
//       new ApiResponse(
//         200,
//         {
//           user: loggedInUser,
//           accessToken,
//           refreshToken,
//         },
//         "User logged in successfully"
//       )
//     );
// });




 const loginUser = asyncHandler(async (req, res) => {
  const { encryptedKey, encryptedData } = req.body;
console.log('LOGIN POST received. Body:', req.body);
  if (!encryptedKey || !encryptedData) {
      console.error("Missing encryptedKey/encryptedData!", req.body);
    throw new ApiError(400, 'Encrypted data missing');
  }

  const aesKey = decryptAESKey(encryptedKey);
  const { email, password } = decryptDataAES(encryptedData, aesKey);

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id);

  res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "None" })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "None" })
    .json(
      new ApiResponse(
        200,
        {
          user: {
            _id: user._id,
            email: user.email,
            username: user.username,
            fullname: user.fullname,
          },
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
});

const servePublicKey = asyncHandler(async (req, res) => {
  const publicKey = fs.readFileSync(RSA_PUBLIC_KEY_PATH, "utf8");
  console.log(publicKey, "publickey");
  
  res.status(200).json({ publicKey });
});




const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token expired ");
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    const { accessToken, newRefreshToken } =
      await generateAccessandRefreshTokens(user?._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refresh successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token ");
  }
});

const changeCurretPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

//   console.log("User in request:", req.user);
//   const user = await User.findById(req?.body?._id).select("+password");

const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed successfuly"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
//   return res
//     .status(200)
//     .json(200, req.user, "Current user fetched Successfully");

return res.status(200).json({
  statusCode: 200,
  data: req.user,
  message: "Current user fetched successfully"
});
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "Both field are Required ");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account detail updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image is update successfuly"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image  file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading Cover Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image is changes successfuly"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribedTo",
      },
    },
    {
      subscribersCount: {
        $size: "$subscribers",
      },
      channleSubscribedToCount: {
        $size: "$subscribedTo",
      },
      isSubscribed: {
        $cond: {
          if: { $in: [req.user?._id, "$subscribers.subscriber"] },
          then: true,
          else: false,
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channleSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  console.log(channel, "channel");

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched Successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: new mongoose.Types.ObjectId(req.user._id),
    },
    {
      $lookup: {
        from: "video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        " watch history fetched successfuly "
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurretPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  servePublicKey
};

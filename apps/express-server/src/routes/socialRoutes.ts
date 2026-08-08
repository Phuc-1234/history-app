import { Router } from "express";
import { requireStudent } from "../middlewares/authMiddleware";
import {
    acceptFriendRequest,
    cancelFriendRequest,
    createFriendRequest,
    followUser,
    getFollowers,
    getFollowing,
    getFriends,
    getIncomingFriendRequests,
    getMutualFriends,
    getOutgoingFriendRequests,
    getSocialUserProfile,
    getXpComparison,
    rejectFriendRequest,
    removeFriend,
    searchUsers,
    unfollowUser,
} from "../controllers/socialController";

const router = Router();

// Users
router.get("/users/search", requireStudent, searchUsers);
router.get("/users/:userId/profile", requireStudent, getSocialUserProfile);
router.get("/users/:userId/followers", requireStudent, getFollowers);
router.get("/users/:userId/following", requireStudent, getFollowing);
router.get("/users/:userId/mutual-friends", requireStudent, getMutualFriends);
router.get("/users/:userId/xp-comparison", requireStudent, getXpComparison);

// Friends
router.get("/friends", requireStudent, getFriends);
router.post("/friends/request", requireStudent, createFriendRequest);
router.get("/friends/requests/incoming", requireStudent, getIncomingFriendRequests);
router.get("/friends/requests/outgoing", requireStudent, getOutgoingFriendRequests);
router.post("/friends/requests/:requestId/accept", requireStudent, acceptFriendRequest);
router.post("/friends/requests/:requestId/reject", requireStudent, rejectFriendRequest);
router.delete("/friends/requests/:requestId", requireStudent, cancelFriendRequest);
router.delete("/friends/:friendId", requireStudent, removeFriend);

// Follow
router.post("/follow/:userId", requireStudent, followUser);
router.delete("/follow/:userId", requireStudent, unfollowUser);

export default router;

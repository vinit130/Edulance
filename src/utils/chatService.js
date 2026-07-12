import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  db,
} from "../services/firebaseConfig";

/**
 * Clean and validate user id.
 */
const validateUserId = (userId, label) => {
  if (!userId || typeof userId !== "string") {
    throw new Error(`${label} is missing or invalid`);
  }

  return userId.trim();
};

/**
 * Creates a stable chat room id.
 * Same two users will always produce the same room id.
 */
export const getDirectChatRoomId = (user1, user2) => {
  const cleanUser1 = validateUserId(user1, "First user");
  const cleanUser2 = validateUserId(user2, "Second user");

  if (cleanUser1 === cleanUser2) {
    throw new Error("You cannot create a chat room with yourself");
  }

  return [cleanUser1, cleanUser2].sort().join("_");
};

/**
 * Creates or returns existing direct chat room between two users.
 * Ensures ONLY ONE room per user pair.
 */
export const createOrGetChatRoom = async ({
  user1,
  user2,
  taskId = null,
  taskTitle = "",
}) => {
  const cleanUser1 = validateUserId(user1, "First user");
  const cleanUser2 = validateUserId(user2, "Second user");

  const roomId = getDirectChatRoomId(cleanUser1, cleanUser2);
  const roomRef = doc(db, "chatRooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    await setDoc(roomRef, {
      id: roomId,

      type: "direct",

      users: {
        [cleanUser1]: true,
        [cleanUser2]: true,
      },

      userIds: [cleanUser1, cleanUser2],

      taskId,
      taskTitle,

      lastMessage: "",
      lastMessageSenderId: "",
      unreadCount: {
        [cleanUser1]: 0,
        [cleanUser2]: 0,
      },

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      roomRef,
      {
        users: {
          [cleanUser1]: true,
          [cleanUser2]: true,
        },

        userIds: [cleanUser1, cleanUser2],

        taskId: taskId || roomSnap.data()?.taskId || null,
        taskTitle: taskTitle || roomSnap.data()?.taskTitle || "",

        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return roomId;
};

/**
 * Creates or updates a task-based chat room.
 * Useful when you want one chat room per task.
 */
export const createOrGetTaskChatRoom = async ({
  taskId,
  taskTitle = "",
  ownerId,
  workerId,
}) => {
  if (!taskId || typeof taskId !== "string") {
    throw new Error("Task id is missing or invalid");
  }

  const cleanOwnerId = validateUserId(ownerId, "Task owner");
  const cleanWorkerId = validateUserId(workerId, "Worker");

  const roomId = taskId;
  const roomRef = doc(db, "chatRooms", roomId);

  await setDoc(
    roomRef,
    {
      id: roomId,

      type: "task",

      taskId,
      taskTitle,

      users: {
        [cleanOwnerId]: true,
        [cleanWorkerId]: true,
      },

      userIds: [cleanOwnerId, cleanWorkerId],

      lastMessage: "",
      lastMessageSenderId: "",

      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return roomId;
};
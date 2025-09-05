// lib/models/Post.js
import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";

export class Post {
  static async getCollection() {
    const client = await clientPromise;
    const db = client.db("blogspace");
    return db.collection("posts");
  }

  // ✅ Fetch all posts (lightweight: only summary fields)
  static async getAll() {
    const collection = await this.getCollection();
    const posts = await collection
      .find({}, { projection: { title: 1, image: 1, author: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray();

    return posts.map(post => ({
      id: post._id.toString(),
      title: post.title || "",
      image: post.image || "",
      author: post.author || "",
      createdAt: post.createdAt || null
    }));
  }

  // ✅ Fetch single post for viewing/editing
  static async getById(id) {
    const collection = await this.getCollection();
    const post = await collection.findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          title: 1,
          content: 1,
          image: 1,
          authorId: 1,
          author: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    );

    if (!post) return null;

    return {
      id: post._id.toString(),
      title: post.title || "",
      content: post.content || "",
      image: post.image || "",
      authorId: post.authorId?.toString() || "",
      author: post.author || "",
      createdAt: post.createdAt || null,
      updatedAt: post.updatedAt || null
    };
  }

  // ✅ Create new post
  static async create({ title, content, image, author, authorId }) {
    const collection = await this.getCollection();
    const doc = {
      title,
      content,
      image: image || null,
      author,
      authorId,
      createdAt: new Date(),
      updatedAt: null
    };
    const result = await collection.insertOne(doc);

    return {
      id: result.insertedId.toString(),
      ...doc
    };
  }

  // ✅ Update post
  static async update(id, updateData) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    return this.getById(id); // returns lean object
  }

  // ✅ Delete post
  static async delete(id) {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // ✅ Search posts (lightweight: only summary fields)
  static async search(searchTerm) {
    const collection = await this.getCollection();
    const posts = await collection
      .find(
        {
          $or: [
            { title: { $regex: searchTerm, $options: "i" } },
            { content: { $regex: searchTerm, $options: "i" } }
          ]
        },
        { projection: { title: 1, image: 1, author: 1, createdAt: 1 } }
      )
      .sort({ createdAt: -1 })
      .toArray();

    return posts.map(post => ({
      id: post._id.toString(),
      title: post.title || "",
      image: post.image || "",
      author: post.author || "",
      createdAt: post.createdAt || null
    }));
  }
}

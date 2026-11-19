import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

export const MongoInventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);

// CQRS Read: Get all products from MongoDB
export const getAllFromMongo = async () => {
  return await MongoInventory.find({}).sort({ createdAt: -1 });
};

// CQRS Read: Get product by productId from MongoDB
export const getByProductIdFromMongo = async (productId) => {
  return await MongoInventory.findOne({ productId });
};

// CQRS Sync: Upsert product into MongoDB
export const upsertToMongo = async (productData) => {
  const { productId, name, stock, price } = productData;
  return await MongoInventory.findOneAndUpdate(
    { productId },
    {
      productId,
      name,
      stock: Number(stock),
      price: Number(price),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
};

// CQRS Sync: Delete product from MongoDB
export const deleteFromMongo = async (productId) => {
  return await MongoInventory.deleteOne({ productId });
};

import mongoose from "mongoose";

const { Schema } = mongoose;

const uploadedDocumentSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    data: {
      type: Buffer,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const UploadedDocument =
  mongoose.models.UploadedDocument ||
  mongoose.model("UploadedDocument", uploadedDocumentSchema);

export default UploadedDocument;

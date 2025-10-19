import { jest } from "@jest/globals";

jest.unstable_mockModule("../../lib/cloudinary.js", () => ({
  default: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

const cloudinary = (await import("../../lib/cloudinary.js")).default;

describe("Cloudinary", () => {
  it("should call config", () => {
    cloudinary.config();
    expect(cloudinary.config).toHaveBeenCalled();
  });

  it("should upload a file", async () => {
    const mockResult = { secure_url: "https://mocked.url" };
    cloudinary.uploader.upload.mockResolvedValue(mockResult);

    const result = await cloudinary.uploader.upload("/tmp/file.jpg");
    expect(result).toEqual(mockResult);
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith("/tmp/file.jpg");
  });
});

import React from "react";
import Cropper from "react-easy-crop";

import { teamApi } from "apis/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../ui/dialog";
import { Button } from "../../../../ui/button";
import { Camera, Trash, UploadSimple } from "phosphor-react";
import { toast } from "sonner";

type ProfileImageCardProps = {
  userId: number | string;
  imageUrl?: string | null;
  displayName: string;
  onAvatarChange: (avatarUrl: string | null) => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const loadImage = (src: string) =>
  new Promise((resolve: (value: any) => void, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const createCroppedFile = async (
  sourceUrl: string,
  filename: string,
  cropAreaPixels: {
    height: number;
    width: number;
    x: number;
    y: number;
  }
) => {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to prepare image crop");

  context.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const dataUrl = canvas.toDataURL("image/png");
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], `${filename.replace(/\.[^.]+$/, "")}.png`, {
    type: "image/png",
  });
};

const ProfileImageCard = ({
  userId,
  imageUrl,
  displayName,
  onAvatarChange,
}: ProfileImageCardProps) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [sourceUrl, setSourceUrl] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    imageUrl || null
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [cropAreaPixels, setCropAreaPixels] = React.useState<{
    height: number;
    width: number;
    x: number;
    y: number;
  } | null>(null);
  const [filename, setFilename] = React.useState("avatar.jpg");
  const [isUploading, setIsUploading] = React.useState(false);
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setPreviewUrl(imageUrl || null);
    setImageLoadFailed(false);
  }, [imageUrl]);

  React.useEffect(
    () => () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    },
    [sourceUrl]
  );

  const initials = React.useMemo(() => {
    const value = displayName
      .split(" ")
      .map(part => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return value || "M";
  }, [displayName]);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Profile image must be smaller than 5 MB.");

      return;
    }

    const nextSourceUrl = URL.createObjectURL(file);
    await loadImage(nextSourceUrl);

    if (sourceUrl) URL.revokeObjectURL(sourceUrl);

    setFilename(file.name);
    setSourceUrl(nextSourceUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropAreaPixels(null);
    setIsDialogOpen(true);
  };

  const handleCropUpload = async () => {
    if (!sourceUrl) return;

    try {
      setIsUploading(true);

      if (!cropAreaPixels) {
        throw new Error("Please adjust the image before saving.");
      }

      const croppedFile = await createCroppedFile(
        sourceUrl,
        filename,
        cropAreaPixels
      );
      const formData = new FormData();
      formData.append("user[avatar]", croppedFile);

      const response = await teamApi.updateTeamMemberAvatar(userId, formData);
      const nextUrl = response.data.avatar_url;

      setPreviewUrl(nextUrl);
      onAvatarChange(nextUrl);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          error.message ||
          "Failed to upload profile image."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsUploading(true);
      await teamApi.destroyTeamMemberAvatar(userId);
      setPreviewUrl(null);
      onAvatarChange(null);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          error.message ||
          "Failed to remove profile image."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-border bg-muted shadow-sm">
            {previewUrl && !imageLoadFailed ? (
              <img
                alt={displayName}
                className="h-full w-full object-cover"
                src={previewUrl}
                onError={() => setImageLoadFailed(true)}
              />
            ) : (
              <span className="text-xl font-semibold text-foreground">
                {initials}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Profile photo
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload a square photo for your workspace profile.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2">
            <Button
              className="w-full"
              onClick={openFilePicker}
              type="button"
              variant="outline"
            >
              <UploadSimple className="mr-2 h-4 w-4" />
              Upload photo
            </Button>
            {previewUrl && (
              <Button
                className="w-full"
                disabled={isUploading}
                onClick={handleDelete}
                type="button"
                variant="ghost"
              >
                <Trash className="mr-2 h-4 w-4" />
                Remove photo
              </Button>
            )}
          </div>
        </div>
        <input
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          data-testid="profile-image-input"
          ref={inputRef}
          type="file"
          onChange={handleFileSelection}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adjust profile photo</DialogTitle>
            <DialogDescription>
              Choose the part of the image you want to keep.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              {sourceUrl ? (
                <div className="relative h-[22rem] w-full bg-muted">
                  <Cropper
                    aspect={1}
                    crop={crop}
                    cropShape="round"
                    image={sourceUrl}
                    objectFit="cover"
                    showGrid={false}
                    zoom={zoom}
                    onCropChange={setCrop}
                    onCropComplete={(_, areaPixels) =>
                      setCropAreaPixels(areaPixels)
                    }
                    onZoomChange={setZoom}
                  />
                </div>
              ) : (
                <div className="flex h-[22rem] items-center justify-center text-sm text-muted-foreground">
                  <Camera className="mr-2 h-4 w-4" />
                  No image selected
                </div>
              )}
            </div>
            <label className="space-y-2 text-sm text-foreground">
              Zoom
              <input
                aria-label="Zoom"
                className="w-full accent-foreground"
                max={3}
                min={1}
                step={0.05}
                type="range"
                value={zoom}
                onChange={event => setZoom(Number(event.target.value))}
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              disabled={isUploading}
              onClick={() => setIsDialogOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isUploading || !sourceUrl}
              onClick={handleCropUpload}
              type="button"
            >
              Save photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileImageCard;

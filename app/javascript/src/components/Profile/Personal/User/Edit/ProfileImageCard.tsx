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
import { i18n } from "../../../../../i18n";
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

const canvasToBlob = canvas =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error(i18n.t("profile.uploadPhotoFailed")));
      }
    }, "image/png");
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
  if (!context) throw new Error(i18n.t("profile.adjustProfilePhoto"));

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

  const blob = await canvasToBlob(canvas);

  return new File([blob], `${filename.replace(/\.[^.]+$/, "")}.png`, {
    type: "image/png",
  });
};

const resolveApiErrorMessage = (error: any, fallbackMessage: string) => {
  const errors = error?.response?.data?.errors;
  const stringError = typeof errors === "string" ? errors : "";
  const flattenedErrors = Array.isArray(errors)
    ? errors.join(", ")
    : typeof errors === "object" && errors !== null
    ? Object.values(errors).flat().join(", ")
    : "";

  const serverMessage =
    error?.response?.data?.error ||
    error?.response?.data?.notice ||
    stringError ||
    flattenedErrors;

  if (typeof serverMessage === "string" && serverMessage.trim().length > 0) {
    return serverMessage;
  }

  return fallbackMessage;
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

  const closeEditor = () => {
    setIsDialogOpen(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropAreaPixels(null);
  };

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(i18n.t("invalidImageFormat"));

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(i18n.t("invalidImageSize", { fileSize: 5120 }));

      return;
    }

    const nextSourceUrl = URL.createObjectURL(file);

    try {
      await loadImage(nextSourceUrl);
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);

      setFilename(file.name);
      setSourceUrl(nextSourceUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropAreaPixels(null);
      setIsDialogOpen(true);
    } catch (_error) {
      URL.revokeObjectURL(nextSourceUrl);
      toast.error(i18n.t("profile.uploadPhotoFailed"));
    }
  };

  const handleCropUpload = async () => {
    if (!sourceUrl) return;

    try {
      setIsUploading(true);

      if (!cropAreaPixels) {
        throw new Error(i18n.t("profile.adjustProfilePhotoDescription"));
      }

      const croppedFile = await createCroppedFile(
        sourceUrl,
        filename,
        cropAreaPixels
      );
      const formData = new FormData();
      formData.append("user[avatar]", croppedFile);

      const response = await teamApi.updateTeamMemberAvatar(userId, formData, {
        skipErrorToast: true,
      });
      const nextUrl = response.data.avatar_url;

      setPreviewUrl(nextUrl);
      setImageLoadFailed(false);
      onAvatarChange(nextUrl);
      closeEditor();
    } catch (error) {
      toast.error(
        resolveApiErrorMessage(error, i18n.t("profile.uploadPhotoFailed"))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsUploading(true);
      await teamApi.destroyTeamMemberAvatar(userId, {
        skipErrorToast: true,
      });
      setPreviewUrl(null);
      setImageLoadFailed(false);
      onAvatarChange(null);
    } catch (error) {
      toast.error(
        resolveApiErrorMessage(error, i18n.t("profile.removePhotoFailed"))
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-muted shadow-sm">
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
            <button
              aria-label={i18n.t("profile.uploadPhoto")}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent"
              data-testid="profile-image-edit-trigger"
              type="button"
              onClick={openFilePicker}
            >
              <UploadSimple className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              {i18n.t("profile.profilePhoto")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {i18n.t("profile.profilePhotoDescription")}
            </p>
          </div>
          <div className="flex w-full gap-2">
            <Button
              className="flex-1"
              onClick={openFilePicker}
              type="button"
              variant="outline"
            >
              <UploadSimple className="mr-2 h-4 w-4" />
              {i18n.t("profile.uploadPhoto")}
            </Button>
            {previewUrl && (
              <Button
                className="flex-1"
                disabled={isUploading}
                onClick={handleDelete}
                type="button"
                variant="ghost"
              >
                <Trash className="mr-2 h-4 w-4" />
                {i18n.t("profile.removePhoto")}
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

      <Dialog
        open={isDialogOpen}
        onOpenChange={open => {
          if (!open) closeEditor();
          else setIsDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{i18n.t("profile.adjustProfilePhoto")}</DialogTitle>
            <DialogDescription>
              {i18n.t("profile.adjustProfilePhotoDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
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
                    {i18n.t("profile.noImageSelected")}
                  </div>
                )}
              </div>
              <label className="space-y-2 text-sm text-foreground">
                {i18n.t("profile.zoom")}
                <input
                  aria-label={i18n.t("profile.zoom")}
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
            <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">
                {i18n.t("profile.profilePhoto")}
              </p>
              <p className="text-xs text-muted-foreground">
                {i18n.t("profile.adjustProfilePhotoDescription")}
              </p>
              <div className="flex justify-center py-2">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                  {sourceUrl ? (
                    <img
                      alt={displayName}
                      className="h-full w-full object-cover"
                      src={sourceUrl}
                    />
                  ) : (
                    <span className="text-base font-semibold text-foreground">
                      {initials}
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                {i18n.t("profile.adjustProfilePhotoDescription")}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={isUploading}
              onClick={closeEditor}
              type="button"
              variant="outline"
            >
              {i18n.t("cancel")}
            </Button>
            <Button
              disabled={isUploading || !sourceUrl}
              onClick={handleCropUpload}
              type="button"
            >
              {isUploading
                ? `${i18n.t("profile.savePhoto")}...`
                : i18n.t("profile.savePhoto")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileImageCard;

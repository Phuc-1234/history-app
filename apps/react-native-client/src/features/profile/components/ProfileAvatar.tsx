import React from "react";
import { AvatarWithFrame } from "@/components/ui";

interface ProfileAvatarProps {
    uri?: string | null;
    frameUri?: string | null;
    size?: number;
    onEditPress?: () => void;
    showEditButton?: boolean;
    name?: string;
    isPro?: boolean;
}

export default function ProfileAvatar({
    uri,
    frameUri,
    size = 120,
    onEditPress,
    showEditButton = true,
    name = "",
    isPro = false,
}: ProfileAvatarProps) {
    return (
        <AvatarWithFrame
            uri={uri}
            frameUri={frameUri}
            size={size}
            name={name}
            borderWidth={2}
            showEditButton={showEditButton}
            onEditPress={onEditPress}
            isPro={isPro}
        />
    );
}

import React from "react";
import AvatarWithFrame, { getInitials } from "./AvatarWithFrame";
import type { CardUser } from "./types";

export { getInitials };

export interface AvatarProps {
    user: Partial<CardUser> & { name?: string; avatar?: string | null };
    size?: number;
    borderWidth?: number;
    style?: any;
}

export function Avatar({ user, size = 52, borderWidth = 2, style }: AvatarProps) {
    const avatarUri = user.avatar ?? null;
    const frameUri = user.frameUri ?? user.equippedFrameUrl ?? null;
    const name = user.name ?? "";

    return (
        <AvatarWithFrame
            uri={avatarUri}
            frameUri={frameUri}
            size={size}
            name={name}
            borderWidth={borderWidth}
            style={style}
        />
    );
}

export default Avatar;

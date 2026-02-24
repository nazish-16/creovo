export const DEVICE_PRESETS = {
    "iphone-15-pro": {
        name: "iPhone 15 Pro",
        width: 393,
        height: 852,
        radius: 54,
        notch: {
            width: 120,
            height: 35,
            radius: 20,
            top: 12,
        },
        type: "mobile" as const,
    },
    "iphone-15-plus": {
        name: "iPhone 15 Plus",
        width: 430,
        height: 932,
        radius: 54,
        notch: {
            width: 120,
            height: 35,
            radius: 20,
            top: 12,
        },
        type: "mobile" as const,
    },
    "samsung-s24-ultra": {
        name: "Samsung S24 Ultra",
        width: 384,
        height: 854,
        radius: 24,
        notch: {
            width: 10,
            height: 10,
            radius: 5,
            top: 10,
        },
        type: "mobile" as const,
    },
    "pixel-8-pro": {
        name: "Pixel 8 Pro",
        width: 448,
        height: 998,
        radius: 36,
        notch: {
            width: 12,
            height: 12,
            radius: 6,
            top: 12,
        },
        type: "mobile" as const,
    },
    "ipad-pro-11": {
        name: "iPad Pro 11\"",
        width: 834,
        height: 1194,
        radius: 36,
        type: "tablet" as const,
    },
    "ipad-mini": {
        name: "iPad Mini",
        width: 744,
        height: 1133,
        radius: 24,
        type: "tablet" as const,
    },
} as const;

export type DevicePresetType = keyof typeof DEVICE_PRESETS;

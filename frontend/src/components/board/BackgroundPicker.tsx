'use client';

import { useAppToken } from '@/hooks/useAppToken';
import React, { useCallback, useRef, useState } from 'react';

import { Button, Divider, Loader, Tabs, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconLink, IconPalette, IconPhoto, IconSearch, IconUpload } from '@tabler/icons-react';
// Simple debounce function
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
}

// Gradient presets with emoji decorations (Trello-style)
export const GRADIENT_BACKGROUNDS = [
    {
        id: 'gradient-1',
        value: 'linear-gradient(135deg, #0c1e3c 0%, #1a3a5c 100%)',
        emoji: '🔮',
    },
    {
        id: 'gradient-2',
        value: 'linear-gradient(135deg, #1a3a5c 0%, #2d7eb0 100%)',
        emoji: '❄️',
    },
    {
        id: 'gradient-3',
        value: 'linear-gradient(135deg, #164C42 0%, #206A5D 100%)',
        emoji: '🐙',
    },
    {
        id: 'gradient-4',
        value: 'linear-gradient(135deg, #1a3a5c 0%, #00a3bf 100%)',
        emoji: '🧙',
    },
    {
        id: 'gradient-5',
        value: 'linear-gradient(135deg, #6b4c9a 0%, #cd5a91 100%)',
        emoji: '🌈',
    },
    {
        id: 'gradient-6',
        value: 'linear-gradient(135deg, #d84315 0%, #ff9800 100%)',
        emoji: '🍑',
    },
    {
        id: 'gradient-7',
        value: 'linear-gradient(135deg, #ec407a 0%, #f48fb1 100%)',
        emoji: '🌸',
    },
    {
        id: 'gradient-8',
        value: 'linear-gradient(135deg, #00796b 0%, #26a69a 100%)',
        emoji: '🌍',
    },
    {
        id: 'gradient-9',
        value: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        emoji: '👽',
    },
    {
        id: 'gradient-10',
        value: 'linear-gradient(135deg, #4a1c0a 0%, #8b4513 100%)',
        emoji: '🧙‍♂️',
    },
];

// Solid color presets
export const SOLID_COLORS = [
    '#206A5D',
    '#d29034',
    '#519839',
    '#b04632',
    '#89609e',
    '#cd5a91',
    '#4bbf6b',
    '#00aecc',
    '#838c91',
];

// Default sample images (fallback when no search)
const DEFAULT_IMAGES = [
    { id: '1', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80' },
    { id: '2', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', thumb: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&q=80' },
    { id: '3', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80', thumb: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&q=80' },
    { id: '4', url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80', thumb: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=200&q=80' },
    { id: '5', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80' },
    { id: '6', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', thumb: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&q=80' },
];

interface UnsplashPhoto {
    id: string;
    url: string;
    thumb: string;
}

interface BackgroundPickerProps {
    value?: string;
    imageValue?: string;
    onChange?: (value: string) => void;
    onImageChange?: (url: string) => void;
}

export default function BackgroundPicker({
    value,
    imageValue,
    onChange,
    onImageChange
}: BackgroundPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState(imageValue ? 'photos' : 'colors');
    const [urlInput, setUrlInput] = useState('');
    const [isValidatingUrl, setIsValidatingUrl] = useState(false);
    const token = useAppToken();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

    // Search Unsplash
    const searchUnsplash = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        if (!UNSPLASH_ACCESS_KEY) {
            // Fallback: filter default images based on query (basic)
            notifications.show({ message: 'Unsplash API not configured. Showing default images.', color: 'blue' });
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
                {
                    headers: {
                        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            const photos: UnsplashPhoto[] = data.results.map((photo: any) => ({
                id: photo.id,
                url: photo.urls.regular,
                thumb: photo.urls.thumb,
            }));
            setSearchResults(photos);
        } catch (error) {
            console.error('Unsplash search error:', error);
            notifications.show({ title: 'Error', message: 'Failed to search images', color: 'red' });
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((query: string) => searchUnsplash(query), 500),
        [UNSPLASH_ACCESS_KEY]
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const handleSelect = (bg: string) => {
        onChange?.(bg);
        // Clear image when selecting color/gradient
        onImageChange?.('');
    };

    const handleImageSelect = (url: string) => {
        onImageChange?.(url);
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            if (data.success && data.data?.url) {
                onImageChange?.(data.data.url);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message || 'Failed to upload image', color: 'red' });
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                notifications.show({ title: 'Error', message: 'Please select an image file', color: 'red' });
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                notifications.show({ title: 'Error', message: 'Image size must be less than 10MB', color: 'red' });
                return;
            }
            handleFileUpload(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle URL input
    const handleUrlSubmit = async () => {
        const url = urlInput.trim();
        if (!url) {
            notifications.show({ message: 'Please enter an image URL', color: 'yellow' });
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            notifications.show({ title: 'Error', message: 'Invalid URL format', color: 'red' });
            return;
        }

        // Check if URL points to an image
        setIsValidatingUrl(true);
        try {
            // Create an image element to validate the URL
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = url;
                // Timeout after 10 seconds
                setTimeout(() => reject(new Error('Image load timeout')), 10000);
            });

            onImageChange?.(url);
            setUrlInput('');
        } catch (error: any) {
            notifications.show({ title: 'Error', message: 'Could not load image from URL. Please check the URL is valid and accessible.', color: 'red' });
        } finally {
            setIsValidatingUrl(false);
        }
    };

    const isSelected = (bg: string) => value === bg && !imageValue;
    const isImageSelected = (url: string) => imageValue === url;

    // Images to display (search results or defaults)
    const displayImages = searchQuery.trim() && searchResults.length > 0
        ? searchResults
        : DEFAULT_IMAGES;

    // Photos Tab Content
    const PhotosTab = (
        <div>
            {/* Search Input */}
            <TextInput
                placeholder="Search photos..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={handleSearchChange}
                size="sm"
                style={{ marginBottom: 12 }}

            />

            {/* Images Grid */}
            {isSearching ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                    <Loader size="sm" />
                    <Text c="dimmed" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                        Searching...
                    </Text>
                </div>
            ) : searchQuery.trim() && searchResults.length === 0 ? (
                <Text c="dimmed" ta="center" py="md">No images found</Text>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 8,
                        marginBottom: 12,
                        maxHeight: 200,
                        overflowY: 'auto',
                    }}
                >
                    {displayImages.map((photo) => (
                        <div
                            key={photo.id}
                            onClick={() => handleImageSelect(photo.url)}
                            style={{
                                height: 56,
                                borderRadius: 8,
                                backgroundImage: `url(${photo.thumb})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                border: isImageSelected(photo.url)
                                    ? '2px solid #fff'
                                    : '2px solid transparent',
                                boxShadow: isImageSelected(photo.url)
                                    ? '0 0 0 2px var(--mantine-primary-color-filled)'
                                    : 'none',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isImageSelected(photo.url) && (
                                <IconCheck size={14} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Unsplash Attribution */}
            {UNSPLASH_ACCESS_KEY && (
                <Text c="dimmed" style={{ fontSize: 10, display: 'block', marginBottom: 8 }}>
                    Photos by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
                </Text>
            )}

            <Divider style={{ margin: '8px 0' }} />

            {/* Upload Button */}
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <Button
                    leftSection={uploading ? <Loader size="sm" /> : <IconUpload size={16} />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    size="sm"
                    fullWidth
                >
                    {uploading ? 'Uploading...' : 'Upload from computer'}
                </Button>
            </div>

            <Divider label="or" labelPosition="center" style={{ margin: '12px 0' }} />

            {/* URL Input */}
            <div>
                <Text c="dimmed" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
                    From URL
                </Text>
                <div style={{ width: '100%' }}>
                    <TextInput
                        placeholder="Paste image URL here..."
                        leftSection={<IconLink size={16} />}
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUrlSubmit(); }}
                        size="sm"
                        disabled={isValidatingUrl}
                        style={{ flex: 1 }}
                    />
                    <Button

                        size="sm"
                        onClick={handleUrlSubmit}
                        loading={isValidatingUrl}
                        disabled={!urlInput.trim()}
                    >
                        Apply
                    </Button>
                </div>
                <Text c="dimmed" style={{ fontSize: 10, marginTop: 4, display: 'block' }}>
                    Supports JPG, PNG, GIF, WebP formats
                </Text>
            </div>

            {/* Current Image Preview */}
            {imageValue && (
                <div
                    style={{
                        height: 60,
                        borderRadius: 8,
                        backgroundImage: `url(${imageValue})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        border: '2px solid var(--mantine-primary-color-filled)',
                        marginTop: 12,
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                        }}
                    >
                        Current
                    </div>
                    <Button
                        size="sm"
                        color="red"
                        onClick={() => onImageChange?.('')}
                        style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            fontSize: 10,
                            padding: '0 4px',
                            height: 20,
                        }}
                    >
                        ✕
                    </Button>
                </div>
            )}
        </div>
    );

    // Colors Tab Content
    const ColorsTab = (
        <div>
            {/* Gradient Section */}
            <Text c="dimmed" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                Gradients
            </Text>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                    marginBottom: 16,
                }}
            >
                {GRADIENT_BACKGROUNDS.map((gradient) => (
                    <div
                        key={gradient.id}
                        onClick={() => handleSelect(gradient.value)}
                        style={{
                            height: 56,
                            borderRadius: 8,
                            background: gradient.value,
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: 8,
                            border: isSelected(gradient.value)
                                ? '2px solid #fff'
                                : '2px solid transparent',
                            boxShadow: isSelected(gradient.value)
                                ? '0 0 0 2px #206A5D'
                                : 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span style={{ fontSize: 18 }}>{gradient.emoji}</span>
                        {isSelected(gradient.value) && (
                            <IconCheck size={14} />
                        )}
                    </div>
                ))}
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Solid Colors Section */}
            <Text c="dimmed" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                Solid Colors
            </Text>
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                }}
            >
                {SOLID_COLORS.map((color) => (
                    <div
                        key={color}
                        onClick={() => handleSelect(color)}
                        style={{
                            width: 40,
                            height: 32,
                            borderRadius: 4,
                            background: color,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: isSelected(color)
                                ? '2px solid #fff'
                                : '2px solid transparent',
                            boxShadow: isSelected(color)
                                ? '0 0 0 2px #206A5D'
                                : 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {isSelected(color) && (
                            <IconCheck size={14} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="background-picker">
            <Tabs
                value={activeTab}
                onChange={(val) => setActiveTab(val || 'photos')}
            >
                <Tabs.List>
                    <Tabs.Tab value="photos" leftSection={<IconPhoto size={16} />}>Photos</Tabs.Tab>
                    <Tabs.Tab value="colors" leftSection={<IconPalette size={16} />}>Colors</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="photos">{PhotosTab}</Tabs.Panel>
                <Tabs.Panel value="colors">{ColorsTab}</Tabs.Panel>
            </Tabs>
        </div>
    );
}

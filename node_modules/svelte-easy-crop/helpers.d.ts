import type { Size, ImageSize, Point } from './types';
/**
 * Compute the dimension of the crop area based on image size and aspect ratio
 * @param imgWidth width of the src image in pixels
 * @param imgHeight height of the src image in pixels
 * @param aspect aspect ratio of the crop
 */
export declare function getCropSize(imgWidth: number, imgHeight: number, aspect: number): {
    width: number;
    height: number;
};
/**
 * Ensure a new image position stays in the crop area.
 * @param position new x/y position requested for the image
 * @param imageSize width/height of the src image
 * @param cropSize width/height of the crop area
 * @param  zoom zoom value
 * @returns
 */
export declare function restrictPosition(position: Point, imageSize: Size, cropSize: Size, zoom: number): Point;
export declare function getDistanceBetweenPoints(pointA: Point, pointB: Point): number;
/**
 * Compute the output cropped area of the image in percentages and pixels.
 * x/y are the top-left coordinates on the src image
 * @param  crop x/y position of the current center of the image
 * @param  imageSize width/height of the src image (default is size on the screen, natural is the original size)
 * @param  cropSize width/height of the crop area
 * @param aspect aspect value
 * @param zoom zoom value
 * @param restrictPosition whether we should limit or not the cropped area
 */
export declare function computeCroppedArea(crop: Point, imgSize: ImageSize, cropSize: Size, aspect: number, zoom: number, restrictPosition?: boolean): {
    croppedAreaPercentages: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    croppedAreaPixels: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};
/**
 * Return the point that is the center of point a and b
 * @param a
 * @param b
 */
export declare function getCenter(a: Point, b: Point): {
    x: number;
    y: number;
};

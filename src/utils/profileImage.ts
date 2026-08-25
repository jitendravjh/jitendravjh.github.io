import { getImage } from 'astro:assets';
import profileImg from '../assets/profile.jpg';

// One source of truth for the profile photo: src/assets/profile.jpg.
// Replace that file to change the picture everywhere.
export { profileImg };

// For CSS backgrounds and runtime JSON, which need a plain URL rather than <Image>.
export async function profileUrl(size: number) {
	const image = await getImage({ src: profileImg, width: size, height: size, format: 'webp' });
	return image.src;
}

// 3D flip as inline styles for the lesson 2 and 3 cards. Tailwind arbitrary classes such as
// [transform:rotateY(180deg)] lost to other rules in production, so the card turned blank when flipped;
// inline styles cannot be overridden by any stylesheet.
export const FLIP_FACE_STYLE = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };
export const FLIP_BACK_STYLE = { transform: 'rotateY(180deg)' };

export function flipInnerStyle(flipped) {
  return {
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',
    transition: 'transform 500ms cubic-bezier(.2,.8,.2,1)',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
  };
}

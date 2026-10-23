import { useEffect } from 'react';

/* Boots the page router after the shell has rendered, then starts the scroll/page animations. */
export default function useApp() {
  useEffect(() => {
    import('../utils/bootstrap.js')
      .then((m) => m.bootstrap())
      .then(() => import('../utils/animations.js'))
      .then((a) => a.initAnimations());
  }, []);
}

import { useEffect } from 'react';

/* Boots the page router after the shell has rendered. The motion/effects engine (utils/fx.js) is started by the bootstrap. */
export default function useApp() {
  useEffect(() => {
    import('../utils/bootstrap.js').then((m) => m.bootstrap());
  }, []);
}

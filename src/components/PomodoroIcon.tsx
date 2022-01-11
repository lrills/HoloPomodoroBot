import Machinat from '@machinat/core';
import { makeContainer } from '@machinat/core/service';
import { OshiVtuberI } from '../constant';

export default makeContainer({
  deps: [OshiVtuberI],
})(function PomodoroIcon(vtuber) {
  return (_: {}) => {
    return <>{vtuber?.pomodoroIcon || '🍅'}</>;
  };
});

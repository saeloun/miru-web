import React, { useRef, useEffect } from "react";

const CurrentHourLine: React.FC<ICurrentHourLineProps> = ({ className, currentTime }) => {
  /**
   * One Hour in Minute
   */
  const HOUR_IN_MINUTE = 60;
  /**
   * Hour row height in px value
   */
  const HOUR_HEIGHT = 60;
  /**
   * Current Hour Line Top calculation from curent hour and minute
   */
  const wrapperStyle: any = {
    top:
      currentTime.hour * HOUR_HEIGHT +
      (currentTime.minute / HOUR_IN_MINUTE) * HOUR_HEIGHT,
  };

  const currentHourLineRef = useRef(null);

  useEffect(() => {
    if (currentHourLineRef && currentHourLineRef.current) {
      const scrollToTop = currentHourLineRef.current.offsetTop;
      currentHourLineRef.current.scrollIntoView({ top: scrollToTop });
    }
  }, []);

  return (
    <div ref={currentHourLineRef} style={wrapperStyle} className={[className, 'current-hour-line'].join(' ')}>
      <div className={'circle'} />
      <div className={'line'} />
    </div>
  );
};

interface ICurrentHourLineProps {
  className?: string
  currentTime: any
}

export default CurrentHourLine;

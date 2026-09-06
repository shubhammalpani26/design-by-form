import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { Reel } from "./Reel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="main"
        component={MainVideo}
        durationInFrames={960}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="reel"
        component={Reel}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

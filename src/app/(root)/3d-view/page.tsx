"use client";

import dynamic from "next/dynamic";

const ThreeDView = dynamic(() => import("@/components/three/ThreeDView"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-background text-sm text-muted-foreground font-body">
      Loading 3D viewer...
    </div>
  ),
});

const ThreeDViewPage = () => {
  return <ThreeDView />;
};

export default ThreeDViewPage;

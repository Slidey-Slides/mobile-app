"use client";
import Image from "next/image";
import Translator from "./components/Translator";
import { useState } from "react";
import Connection from "./components/Connection";

export default function Home() {
  function handleOrientation(event: any) {
    var absolute = event.absolute;
    var alpha = event.alpha;
    var beta = event.beta;
    var gamma = event.gamma;
    // Do stuff with the new orientation data
  }

  const [connection, setConnection] = useState(true);
  return <div>{connection ? <Translator /> : <Connection setConnection={setConnection} />}</div>;
}

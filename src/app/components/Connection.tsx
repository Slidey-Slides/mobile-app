import React, { Dispatch, SetStateAction } from "react";

type ConnectionProps = {
  setConnection: Dispatch<SetStateAction<boolean>>;
};

const Connection: React.FC<ConnectionProps> = ({ setConnection }) => {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold my-10">CONNECT TO SLIDEY SLIDES</h1>
      <form className="w-full p-10" onSubmit={() => setConnection(true)}>
        <input
          type="text"
          className="rounded-sm border-2 p-4 text-center  outline-0 tracking-widest w-full "
          maxLength={20}
          placeholder="Connection Code"
        />
        <input
          type="submit"
          className="my-4 rounded-sm border-2 bg-purple-400 p-4 text-center tracking-widest w-full hover:scale-y-90 "
          maxLength={20}
        />
      </form>
    </div>
  );
};
export default Connection;

import Image from "next/image";

const QIDDIYA_IMAGE = "/images/Qiddiya City Image.jpg";

const Home = () => {
  return (
    <div>
      <Image src={QIDDIYA_IMAGE} alt="Qiddiya City" width={500} height={500} className="w-full h-full object-contain" />
    </div>
  );
};

export default Home;
import React, { useEffect } from "react";
import Typewriter from "typewriter-effect";
import Button from "../components/Button";
export default function Home() {

  return (


   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-11/12 mx-auto min-h-screen items-center md:py-14 lg:py-24 xl:py-14 lg:mt-3 xl:mt-5">
  {/* Left Section */}
  <div className="flex flex-col justify-center pl-4 lg:pl-0">
    <h1 className="text-3xl mb-8 font-semibold bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent xl:text-4xl lg:text-2xl pb-4">
      Gestioná tus turnos
      <span className="inline-block w-full lg:w-[500px]">
        <Typewriter
          options={{
            strings: ['de manera simple y eficiente', 'desde cualquier lugar'],
            autoStart: true,
            loop: true,
            cursor: '_',
            delay: 70,
            deleteSpeed: 50,
          }}
        />
      </span>
    </h1>

    <p className="py-4 mt-4 text-lg text-gray-500 2xl:py-8 md:py-6 2xl:pr-5">
      Para quienes buscan atención profesional, y para emprendedores que quieren administrar sus agendas fácilmente.
      Nuestra plataforma conecta a clientes con expertos, facilitando la organización y el crecimiento de tu negocio.
      <br />
      Reservá tu turno o administrá tu calendario con la confianza de estar en manos de profesionales.
    </p>

    <div className="mt-4">
      <a href="/registro" className="inline-block bg-gradient-to-r from-blue-600 to-cyan-400 shadow-lg text-white rounded-lg px-12 py-4 hover:scale-105 hover:from-cyan-400 hover:to-blue-600 transition duration-300 ease-in-out">
        Reservar Turnos
      </a>
    </div>
  </div>

  {/* Right Section */}
  <div className="flex justify-end items-center pr-4 lg:pr-0">
    <img
      id="heroImg1"
      className="transition-all duration-300 ease-in-out rounded-lg hover:scale-105 object-contain h-full max-h-screen"
      src="./images/IMGHome.png"
      alt="Awesome hero page image"
    />
  </div>
</div>
  );
}
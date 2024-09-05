"use client";

import React, { useState } from "react";
import Calendar from "react-calendar";
import Card from "../Components/Card";

const Page: React.FC = () => {
  const [cards, setCards] = useState<any[]>([]);

  const handleAddCard = (cardData: any) => {
    setCards([...cards, cardData]);
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Calendar</h1>
      <div className="mb-6 p-4 bg-gray-900 rounded-lg">
        <Calendar />
      </div>
      <h2 className="text-xl font-semibold text-blue-400 mb-4">Add Card</h2>
      <div className="mb-6">
        <Card onAddCard={handleAddCard} />
      </div>
      <h2 className="text-xl font-semibold text-blue-400 mb-4">Card List</h2>
      <div className="space-y-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="p-4 bg-gray-700 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-blue-300 mb-2">
              {card.courseName}
            </h3>
            <p className="mb-1">Date: {card.date}</p>
            <p className="mb-1">Time: {card.time}</p>
            <p className="mb-1">Location: {card.location}</p>
            <p className="mb-1">Repeating?: {card.repeating}</p>
            <p className="mb-1">Description: {card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;

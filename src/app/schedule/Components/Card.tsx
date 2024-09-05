import React, { useState } from 'react';

interface CardProps {
    onAddCard: (cardData: CardData) => void;
}

interface CardData {
    courseName: string;
    date: string;
    time: string;
    location: string;
    repeating: string;
    description: string;
}

const Card: React.FC<CardProps> = ({ onAddCard }) => {
    const [courseName, setCourseName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [repeating, setRepeating] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cardData: CardData = {
            courseName,
            date,
            time,
            location,
            repeating,
            description,
        };
        onAddCard(cardData);
        setCourseName('');
        setDate('');
        setTime('');
        setLocation('');
        setRepeating('');
        setDescription('');
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="form-group">
                <label className="block text-gray-400">Course Name:</label>
                <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
            </div>
            <div className="form-group">
                <label className="block text-gray-400">Date:</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
            </div>
            <div className="form-group">
                <label className="block text-gray-400">Time:</label>
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
            </div>
            <div className="form-group">
                <label className="block text-gray-400">Location:</label>
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
            </div>
            <div className="form-group">
                <label className="block text-gray-400">Repeating:</label>
                <input
                    type="text"
                    value={repeating}
                    onChange={(e) => setRepeating(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
            </div>
            <div className="form-group">
                <label className="block text-gray-400">Description:</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
            </div>
            <button type="submit" className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                Add Card
            </button>
        </form>
    );
};

export default Card;

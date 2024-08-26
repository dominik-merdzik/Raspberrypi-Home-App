"use client";

import { Home } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const Nav = () => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <nav
            style={{
                ...styles.nav,
                backgroundColor: isHovered
                    ? 'rgba(0, 0, 0, 0.5)'
                    : 'rgba(0, 0, 0, 0.2)',
                width: isHovered ? '60px' : '50px', // Increase size on hover
                height: isHovered ? '60px' : '50px', // Increase size on hover
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link href="/" style={styles.link}>
                <Home size={24} color="white" />
            </Link>
        </nav>
    );
};

const styles = {
    nav: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        borderRadius: '0 0 10px 0',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '10px',
        zIndex: 1000,
        transition: 'all 0.3s ease', // Smooth transition for all changes
    },
    link: {
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
    },
};

export default Nav;

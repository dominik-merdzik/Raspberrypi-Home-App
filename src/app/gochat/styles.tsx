const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1A202C',
        color: 'white',
    },
    loginContainer: {
        textAlign: 'center',
    },
    loadingContainer: {
        textAlign: 'center',
    },
    loadingText: {
        width: '300px',
        fontSize: '20px',
        color: 'lightgray',
        marginBottom: '20px',
    },
    chatContainer: {
        width: '600px',
        padding: '20px',
        backgroundColor: '#333',
        borderRadius: '8px',
    },
    headingContainer: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    heading: {
        marginBottom: '20px',
    },
    headingUsername: {
        textAlign: 'right',
        color: '#5f5f5f9b',
    },
    chatBox: {
        height: '500px',
        overflowY: 'scroll',
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#222',
        borderRadius: '8px',
    },
    chatMessage: {
        marginBottom: '10px',
    },
    input: {
        width: '100%',
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '4px',
        border: '1px solid #555',
        backgroundColor: '#444',
        color: 'white',
    },
    colorPicker: {
        width: '100%',
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '4px',
        border: '1px solid #555',
        backgroundColor: '#444',
        color: 'white',
    },
    infoContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        color: 'lightgray',
    },
    timer: {
        color: 'red',
    },
    charCounter: {
        textAlign: 'right',
        color: 'lightgray',
    },
    button: {
        width: '100%',
        padding: '10px',
        borderRadius: '4px',
        backgroundColor: '#61dafb',
        border: 'none',
        color: '#000',
        cursor: 'pointer',
    },
    buttonError: {
        width: '75%',
        padding: '10px',
        borderRadius: '4px',
        backgroundColor: '#61dafb',
        border: 'none',
        color: '#000',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        marginTop: '10px',
    },
};

export default styles;

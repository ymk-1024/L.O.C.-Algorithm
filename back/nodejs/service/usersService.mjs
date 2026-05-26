const test = async (testStr) => {
    let testSStr = 'NG';
    if (testStr == 'OK') {
        testSStr = 'OK';
    }

    return { status: 200, message: 'HANDLER/SERVICE OK', error: 'noError' };
}

export default {
    test
};

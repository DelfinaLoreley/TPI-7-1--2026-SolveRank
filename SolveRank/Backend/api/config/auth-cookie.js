
function guardarToken(res, token) {
    res.cookie('solverank_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
        path: '/'
    });
}

function borrarToken(res) {
    res.clearCookie('solverank_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
}

module.exports = {
    guardarToken,
    borrarToken
};

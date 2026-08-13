let dbConnected = false;

export const setDbConnected = (val) => { dbConnected = !!val; };
export const isDbConnected = () => dbConnected;

export default { setDbConnected, isDbConnected };

import usersService from "../service/usersService.mjs";

const test = async (req, res) => {
  try {
    const result = await usersService.test("OK");
    res.status(result.status).json({
        status: result.status,
        message: result.message,
        error: result.error
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  test,
};
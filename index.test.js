process.env.IS_UNIT_TEST = 1;
const core = require('@actions/core');
const axios = require('axios');
const action = require('./index');

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  notice: jest.fn(),
  setOutput: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  getBooleanInput: jest.fn(),
  info: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn().mockReturnThis(),
}));

const mockNoInstances = [
  {
    instance: 'base',
  },
];

const mock75Availability = [
  {
    instance: 'base',
  },
  {
    instance: '192-168-12-abc',
    health: { status: 'pass' },
  },
  {
    instance: '192-168-13-abc',
    health: { status: 'pass' },
  },
  {
    instance: '192-168-14-abc',
    health: { status: 'pass' },
  },
  {
    instance: '192-168-15-abc',
    health: { status: 'warn' },
  },
];

const vaildURL = 'https://apps-inventory.product.com';
const validAuth = 'abc';

describe('When the input is invalid', () => {
  afterEach(() => {
    core.getInput.mockReset();
    core.setFailed.mockReset();
  });
  it('Should call to core.setFailed to finish the execution when is not a number', async () => {
    core.getInput.mockReturnValueOnce(vaildURL).mockReturnValueOnce(validAuth).mockReturnValueOnce('abc');

    await action.run();

    expect(core.getInput).toHaveBeenNthCalledWith(1, 'apps_inventory_url');
    expect(core.getInput).toHaveBeenNthCalledWith(2, 'apps_inventory_auth');
    expect(core.getInput).toHaveBeenNthCalledWith(3, 'availability_percentage');
    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledWith(`No Valid number provided for 'availability_percentage': abc`);
  });

  it('Should call to core.setFailed to finish the execution when availability is greater than 100', async () => {
    core.getInput.mockReturnValueOnce(vaildURL).mockReturnValueOnce(validAuth).mockReturnValueOnce(200);

    await action.run();

    expect(core.getInput).toHaveBeenNthCalledWith(1, 'apps_inventory_url');
    expect(core.getInput).toHaveBeenNthCalledWith(2, 'apps_inventory_auth');
    expect(core.getInput).toHaveBeenNthCalledWith(3, 'availability_percentage');
    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledWith(`No Valid number provided for 'availability_percentage': 200`);
  });
});

describe('When user input is valid and axios resolved an empty result', () => {
  afterEach(() => {
    core.getInput.mockReset();
    core.setFailed.mockReset();
    axios.get.mockReset();
  });
  it('Should call setFailed to finish the execution', async () => {
    core.getInput.mockReturnValueOnce(vaildURL).mockReturnValueOnce(validAuth).mockReturnValueOnce(80);
    axios.get.mockReturnValue({ data: { result: [] } });

    await action.run();

    expect(core.getInput).toHaveBeenCalledTimes(3);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(vaildURL, {
      headers: { Authorization: validAuth },
    });
    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'Inventory apps did not return any value for your provided url');
  });
});

describe('When availability is less than the client asked for (expected 80, real 75)', () => {
  afterEach(() => {
    core.getInput.mockReset();
    core.setFailed.mockReset();
    core.setOutput.mockReset();
    axios.get.mockReset();
    core.error.mockReset();
    core.notice.mockReset();
    core.warning.mockReset();
  });
  it('Should setFailed and show more details about the request', async () => {
    core.getInput.mockReturnValueOnce(vaildURL).mockReturnValueOnce(validAuth).mockReturnValueOnce(80);
    axios.get.mockReturnValue({ data: { result: mock75Availability } });

    await action.run();

    let failedMessage = 'health-001: Service availability less than client availability provided.\n';
    failedMessage += `Current Availability: 75\n`;
    failedMessage += `Expected Availbility: 80`;

    expect(core.warning).toHaveBeenCalledWith(
      `Percentage by Status: ${JSON.stringify({ warn: 25, pass: 75, fail: 0 })}`
    );
    expect(core.getInput).toHaveBeenCalledTimes(3);
    expect(core.setFailed).toHaveBeenCalledWith(failedMessage);
    expect(core.error).toHaveBeenCalledTimes(0);
    expect(core.notice).toHaveBeenCalledTimes(1);
  });
});

describe('When availability passes if allow_warn_as_passed is true (expected 80, real 100)', () => {
  afterEach(() => {
    core.getInput.mockReset();
    core.setFailed.mockReset();
    axios.get.mockReset();
    core.error.mockReset();
    core.notice.mockReset();
    core.setOutput.mockReset();
    core.warning.mockReset();
    core.getBooleanInput.mockReset();
  });
  it('Should setFailed and show more details about the request', async () => {
    core.getInput
      .mockReturnValueOnce(vaildURL)
      .mockReturnValueOnce(validAuth)
      .mockReturnValueOnce('80')
      .mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValue(true);
    axios.get.mockReturnValue({ data: { result: mock75Availability } });

    await action.run();

    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.getInput).toHaveBeenCalledTimes(3);
    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.error).toHaveBeenCalledTimes(0);
    expect(core.notice).toHaveBeenCalledTimes(1);
  });
});

describe('When a unexpected error happens', () => {
  afterEach(() => {
    core.getInput.mockReset();
    core.setFailed.mockReset();
    axios.get.mockReset();
    core.error.mockReset();
    core.notice.mockReset();
    core.warning.mockReset();
  });
  it('it should call to core.error and set failed', async () => {
    core.getInput.mockReturnValueOnce(vaildURL);
    core.getInput.mockReturnValueOnce(validAuth);
    core.getInput.mockReturnValueOnce(80);
    const error = new Error('unexpected_error');
    axios.get.mockImplementation(() => {
      throw error;
    });

    await action.run();

    expect(core.error).toHaveBeenCalledTimes(1);
    expect(core.warning).toHaveBeenCalledTimes(0);
    expect(core.error).toHaveBeenCalledWith(error);
    expect(core.setFailed).toHaveBeenNthCalledWith(1, error.message);
  });
});

describe('When only base instance is returned by Apps Inventory', () => {
  afterEach(() => {
    core.getInput.mockReset();
    core.setFailed.mockReset();
    axios.get.mockReset();
    core.error.mockReset();
    core.notice.mockReset();
    core.warning.mockReset();
  });
  it('it must ...', async () => {
    core.getInput.mockReturnValueOnce(vaildURL).mockReturnValueOnce(validAuth).mockReturnValueOnce(80);
    axios.get.mockReturnValue({ data: { result: mockNoInstances } });

    await action.run();
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledWith('Inventory apps did find any valid instance for your service');
  });
});

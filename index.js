const core = require('@actions/core');
const axios = require('axios');

const run = async () => {
  const apps_inventory_url = core.getInput('apps_inventory_url');
  const apps_inventory_auth = core.getInput('apps_inventory_auth');
  const availability_percentage = core.getInput('availability_percentage');
  const allow_warn_as_passed = core.getInput('allow_warn_as_passed') || true;

  if (!Number.isInteger(availability_percentage) || +availability_percentage > 100) {
    return core.setFailed("No Valid number provided for 'availability_percentage'");
  }

  try {
    const inventoryResult = await axios.get(apps_inventory_url, {
      headers: {
        Authorization: apps_inventory_auth,
      },
    });
    if (
      !inventoryResult ||
      !inventoryResult.data ||
      !inventoryResult.data.result ||
      !inventoryResult.data.result.length
    ) {
      return core.setFailed('Inventory apps did not return any value for your provided url');
    }

    let { result: instancesResult } = inventoryResult.data;
    instancesResult = instancesResult.filter(({ health }) => health);

    if (!instancesResult.length) {
      return core.setFailed('Inventory apps did find any valid instance for your service');
    }

    const numberOfInstances = instancesResult.length;
    const summaryInstancesChecked = instancesResult.map((instanceObj) => {
      return {
        instance: instanceObj.instance,
        healthStatus: instanceObj.health.status,
      };
    });

    //Calculate
    const percentageByStatus = {};
    const countsByStatus = {
      warn: 0,
      pass: 0,
      fail: 0,
    };

    instancesResult.forEach(({ health }) => {
      if (allow_warn_as_passed && health.status === 'warn') {
        health.status = 'pass';
      }
      countsByStatus[health.status] = countsByStatus[health.status] + 1;
    });

    Object.keys(countsByStatus).forEach((status) => {
      const countStatus = countsByStatus[status];
      const percentage = (countStatus * 100) / numberOfInstances;
      percentageByStatus[status] = percentage;
    });

    //send
    core.notice(JSON.stringify({ summaryInstancesChecked, percentageByStatus }));
    core.setOutput('summary', JSON.stringify({ summaryInstancesChecked, percentageByStatus }));

    //Check
    if (percentageByStatus['pass'] < +availability_percentage) {
      core.warning(`Percentage by Status: ${JSON.stringify(percentageByStatus)}`);
      let failedMessage = 'health-001: Service availability less than client availability provided.\n';
      failedMessage += `Current Availability: ${percentageByStatus['pass']}\n`;
      failedMessage += `Expected Availbility: ${availability_percentage}`;
      return core.setFailed(failedMessage);
    }
  } catch (error) {
    core.error(error);
    return core.setFailed(error.message);
  }
};

if (!process.env.IS_UNIT_TEST) {
  run();
}

module.exports.run = run;

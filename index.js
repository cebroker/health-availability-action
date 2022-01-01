const core = require('@actions/core');
const axios = require('axios');

const run = async () => {
  const apps_inventory_url = core.getInput('apps_inventory_url');
  const apps_inventory_auth = core.getInput('apps_inventory_auth');
  const availability_percentage = core.getInput('availability_percentage');

  if (Number.isNaN(availability_percentage)) {
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
      countsByStatus[health.status] = countsByStatus[health.status] + 1;
    });

    Object.keys(countsByStatus).forEach((status) => {
      const countStatus = countsByStatus[status];
      const percentage = (countStatus * 100) / numberOfInstances;
      percentageByStatus[status] = percentage;
    });

    //Check
    core.setOutput('summary', JSON.stringify(summaryInstancesChecked));
    core.notice('summary', JSON.stringify(summaryInstancesChecked));
    if (percentageByStatus['pass'] < +availability_percentage) {
      core.warning(`App Information: ${JSON.stringify(percentageByStatus)}`);
      return core.setFailed(`
        health-001: Service availability less than client availability provided.
        Current Availability: ${percentageByStatus['pass']}
				Expected Availbility: ${availability_percentage}
    	`);
    }
  } catch (error) {
    return core.setFailed(error);
  }
};

run();
module.exports.run = run;

import originRespModel from '../models/originRespModel';
import SECRET from '../server';

interface Input {
  [key: string]: Record<string, unknown> | string;
}

interface FieldObject {
  name: string;
  children: any[];
}

interface MovieObject {
  name: string;
  resp?: object | undefined;
  statusCode?: number | undefined;
  statusMsg?: string | undefined;
  children: any[];
}

interface resolverResp {
  response?: {
    alias: string;
    originResp?: Object;
    originRespStatus?: Number;
    originRespMessage?: string;
  };
}

interface Output {
  name: string;
  children: any[];
}

export const transformData = async (input: Input): Promise<Output> => {
  if (input === null || input === undefined) {
    // handle case where input is null or undefined
    return { name: 'data', children: [] };
  }

  const resolverQueries = await originRespModel
    .find({ id: SECRET })
    .sort({ timestamp: -1 })
    .lean()
    .exec()
    .then((docs) => docs.reverse());

  // function code here
  const output: Output = { name: 'data', children: [] };
  for (let [inputKey, inputValue] of Object.entries(input)) {
    const matchedQuery: resolverResp | undefined = resolverQueries.filter(
      (obj: resolverResp): boolean => {
        return obj.response?.alias === inputKey;
      }
    )[0];
    const { originResp, originRespStatus, originRespMessage } =
      matchedQuery?.response || {};
    const movieObject: MovieObject = {
      resp: originResp,
      statusCode: originRespStatus?.valueOf(),
      statusMsg: originRespMessage,
      name: inputKey,
      children: [],
    };
    if (!inputValue) {
      inputValue = {};
    }
    for (const [fieldKey, fieldValue] of Object.entries(inputValue)) {
      if (!Object.keys(inputValue).length) {
        continue;
      }
      if (!fieldValue) {
        const fieldObject: FieldObject = {
          name: fieldKey,
          children: [],
        };
        movieObject.children.push(fieldObject);
      } else {
        const fieldObject = {
          name: fieldKey,
          children: [{ name: fieldValue }],
        };
        movieObject.children.push(fieldObject);
      }
    }
    output.children.push(movieObject);
  }
  return output;
};

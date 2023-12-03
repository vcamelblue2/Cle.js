
export const PROTOCOL = {
  // RESPONSE OPTIONS
  RESP: {
    WAIT_RESP: {__type__: "wait forever", default: true},
    WAIT_RESP_TIMEOUT: {__type__: "wait timeout", options: ["timeout"]},
    NO_WAIT_RESP: {__type__: "no wait"},
  },

  // THEN OPTIONS
  THEN:{
    CONTINUE: {__type__: "continue", default: true},
    TERMINATE: {__type__: "terminate wait"},
    TERMINATE_NO_WAIT: {__type__: "terminate no wait"},
    REPEAT_ALL: {__type__: "repeat all", options: ["max_times"]},
    REPEAT_THIS: {__type__: "repeat this", options: ["max_times"]},
    GOTO: {__type__: "repeat", options: ["index"]}
  }
}

export const OPTIONS = {
  MAX_FULL_REP: 10
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @typedef { {send: (any)=>{}, cancel: (any)=>{}} } ProtocolOpControls
 * @typedef { (action: ProtocolOpControls, params={}, storage: {}, history: [])=>{ send({msg: "hello"})} } ProtocolOp
 * @typedef { (err, params={}, storage, history)=>boolean } ProtocolOpErr
 * @typedef { {sig: any, options: any} } ProtocolResp
 * @typedef { {sig: any, options: any} } ProtocolThen
 * @typedef { {op: ProtocolOp, on_error?: ProtocolOpErr, resp?: ProtocolResp, then?: ProtocolThen} | [ProtocolOp, ProtocolOpErr?, ProtocolResp, ProtocolThen?] } ProtocolStep
 * @typedef { ProtocolStep[] } ProtocolSteps
 */

export class ServerProtocol{
  /**
   * @param { ProtocolSteps } serverSteps 
   */
  constructor(serverSteps){
    
    if (serverSteps.length < 1){
      throw Error("SERVER STEPS ERROR - at least once")
    }

    this.serverSteps = serverSteps
  }

  /**
   * @param { ProtocolSteps } clientSteps 
   */
  async start(clientSteps, initialParams){
    // console.log("proto - start")
    let history = []
    
    let client = {index: 0, numSteps: clientSteps.length, storage: {}, latest_result: {}}
    let server = {index: 0, numSteps: this.serverSteps.length, storage: {}, latest_result: {}}
    let response;
    
    // console.log("proto - init", client, server)

    // FLOWS CAN BE:
    // client -> server -> client -> server -> ... -> server
    // client -> server -> client -> server -> ... -> server -> client
    let full_rep = 0;

    while (client.index < client.numSteps) {

      // TODO handle ERRORS
      
      let clientStepParams = client.index === 0 ? initialParams : server.latest_result
      // console.log("proto - calling client with", client.index, client.numSteps, clientStepParams)
      let clientStepOp = Array.isArray(clientSteps[client.index]) ? clientSteps[client.index][0] : clientSteps[client.index]['op'];
      let clientStepOnErr = Array.isArray(clientSteps[client.index]) ? clientSteps[client.index][1] : clientSteps[client.index]['on_error'];
      let clientStepResp = (Array.isArray(clientSteps[client.index]) ? clientSteps[client.index][2] : clientSteps[client.index]['resp']) ?? {sig: PROTOCOL.RESP.WAIT_RESP};
      let clientStepThen = (Array.isArray(clientSteps[client.index]) ? clientSteps[client.index][3] : clientSteps[client.index]['then']) ?? {sig: PROTOCOL.THEN.CONTINUE};
      try{
        if (clientStepResp.sig === PROTOCOL.RESP.WAIT_RESP){
          client.latest_result = await (new Promise(async (resolve, reject)=>(clientStepOp({send: resolve, cancel: reject}, clientStepParams, client.storage, history))))
        } 
        // todo: timeout
      } catch (err){
        let handled = false
        client.latest_result = undefined
        if (clientStepOnErr !== undefined){
         handled = await clientStepOnErr(err, clientStepParams, client.storage, history)
        }
        if (!handled){
          throw err
        }
      }
      // console.log("proto - client result", client.latest_result)
      history.push({who: "client", params: clientStepParams, result: client.latest_result})
      client.index++;

      response = client.latest_result // client has last message
      // console.log("proto - client is final result", response)
      if (clientStepThen.sig === PROTOCOL.THEN.TERMINATE_NO_WAIT){
        client.index = client.numSteps
        break;
      }

      if (server.index < server.numSteps){ // server has last message
        let serverStepParams = client.latest_result
        // console.log("proto - calling server with", server.index, server.numSteps, serverStepParams)
        let serverStepOp = Array.isArray(this.serverSteps[server.index]) ? this.serverSteps[server.index][0] : this.serverSteps[server.index]['op'];
        let serverStepOnErr = Array.isArray(this.serverSteps[server.index]) ? this.serverSteps[server.index][1] : this.serverSteps[server.index]['on_error'];
        let serverStepResp = (Array.isArray(this.serverSteps[server.index]) ? this.serverSteps[server.index][2] : this.serverSteps[server.index]['resp']) ?? {sig: PROTOCOL.RESP.WAIT_RESP};
        let serverStepThen = (Array.isArray(this.serverSteps[server.index]) ? this.serverSteps[server.index][3] : this.serverSteps[server.index]['then']) ?? {sig: PROTOCOL.THEN.CONTINUE};
        try{
          if (serverStepResp.sig === PROTOCOL.RESP.WAIT_RESP){
            server.latest_result = await (new Promise(async (resolve, reject)=>(serverStepOp({send: resolve, cancel: reject}, serverStepParams, server.storage, history))))
          }
          // todo: timeout
        } catch (err){
          let handled = false
          server.latest_result = undefined
          if (serverStepOnErr !== undefined){
            handled = await serverStepOnErr(err, serverStepParams, server.storage, history)
          }
          if (!handled){
            throw err
          }
        }
        // console.log("proto - server result", server.latest_result)
        history.push({who: "server", params: serverStepParams, result: server.latest_result})
        server.index++;

        response = server.latest_result // server has last message
        // console.log("proto - server is final result", response)
        if (serverStepThen.sig === PROTOCOL.THEN.TERMINATE){
          server.index = server.numSteps
        }
        // else if (serverStepThen.sig === PROTOCOL.THEN.TERMINATE_NO_WAIT){
        //   server.index = server.numSteps
        //   break;
        // }
        else if (serverStepThen.sig === PROTOCOL.THEN.GOTO){
          if (serverStepThen.options.index === undefined){throw Error("PROTO GOTO - Missing Options Index")}
          server.index = serverStepThen.options.index
        }
        // else if (serverStepThen.sig === PROTOCOL.THEN.REPEAT_THIS){
        //   server.index -= 1 
        //   client.index -= 1 
        // }
        else if (serverStepThen.sig === PROTOCOL.THEN.REPEAT_ALL){
          server.index = 0
          client.index = 0
        }
  
      }

      if (clientStepThen.sig === PROTOCOL.THEN.TERMINATE){
        client.index = client.numSteps
      }
      else if (clientStepThen.sig === PROTOCOL.THEN.GOTO){
        if (clientStepThen.options.index === undefined){throw Error("PROTO GOTO - Missing Options Index")}
        client.index = clientStepThen.options.index
      }
      // else if (clientStepThen.sig === PROTOCOL.THEN.REPEAT_THIS){
      //   client.index -= 1 
      //   server.index -= 1 
      // }
      else if (clientStepThen.sig === PROTOCOL.THEN.REPEAT_ALL && (full_rep++ < Math.min(OPTIONS.MAX_FULL_REP, clientStepThen.options.max_times))){
        client.index = 0
        server.index = 0
      }
    }

    // console.log("proto - final result", response)
    return response
  }
}

// to be used in app root
export const useProtocols = {
  // sigal, use
  signal_start_protocol: "stream => any",

  // to be used into client
  def_exec_protocol: async ($, protocolRoute, client, clientSteps, params )=>{
    // console.log("exec protocol", protocolRoute, client, clientSteps, params )
    let responses = $.start_protocol.emitWaitResp(protocolRoute, client, clientSteps, params )
    // console.log(responses)
    let res
    for await (res of responses){
      if (res !== undefined){
        break;
      }
    }
    // console.log("executed protocol, response:", res)
    return res
  },

  // to be colled as server
  def_handle_protocol: async ($, Protocols, protocolRoute, client, clientSteps, params)=>{
    // console.log("handle", Protocols)
    if (protocolRoute in Protocols){
      
      // console.log("start protocol received")
      
      /** @type {ServerProtocol} */
      const protocol = Protocols[protocolRoute]
      // console.log("i will use: ", protocol)

      return await protocol.start(clientSteps, params)
    }

    return undefined;
  }
}

/**
 * 
 * @param {($)=>any} ProtocolsDefFunc 
 * @returns 
 * to be used into server
 */
export const defineProtocols = (ProtocolsDefFunc)=>{
  return {
    
    Protocols: undefined,

    on_scope_start_protocol: async ($, protocolRoute, client, clientSteps, params)=>{
      let resp = await $.handle_protocol($.Protocols, protocolRoute, client, clientSteps, params)
      // console.log("START P", )
      return resp
    },

    dir_define_protocols:{
      onInit($){
        // console.log("init!!")
        $.Protocols = ProtocolsDefFunc($)
        // console.log("init!!", $.Protocols)
      },
    },

  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// EXAMPLE USAGE
// const on_start_protocol = async (protocolRoute, client, clientSteps, params)=>{
  
//   /** @type {ServerProtocol} */
//   const protocol = Protocols.server.routes[protocolRoute]

//   return protocol.start(clientSteps, params)
// }
export const esriImportModules = (modulesMap)=>{
    return new Promise((resolve, reject)=>{

        require([ ...Object.values(modulesMap) ], (...resolvedModules) => {
            resolve({
                ...Object.fromEntries(Object.entries(modulesMap).map(([devSelectedVarName, _], idx) => [devSelectedVarName, resolvedModules[idx]] ))
            })
        },
        (...err)=>{
            reject(...err)
        }
        )
    })
}
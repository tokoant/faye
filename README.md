# faye


setup requx glue (promise middleware, thunk, helpers, action creators, state, reducer, async.flow executor)

High level tasks: Deploy, Build, Test

Express:
	app.post(/deploy,()=>{
		dispatch(actions['deploy'].create(req.body))
	})

/build
/test

Build(
	step1,
	step2
)

Test(
	step1,
	step2
)

Deploy(
	'getCloudRunConfig',
	'update expiresDate on tag',
	'checkCloudRunManifest'(),
	'if run Build'(),
	'checkDockerRegistryManifest',
	'is shouldBuild'
		Build()
	prepare configs for deployment (.env, docker-compose)
	release existing feature on this slot
	update proxy
	deploy to CR (via proxy server by REST api)
	Test()
)

*queue management
*log stream forwarding


redux-promise middleware

const actions  = {
	deploy:{
		create:({pr:1, service:arteus})=>{pr:1, service:arteus}
		start: 
	}
	getCloudRunConfig:{
		create: ({hash})=>{
			id:'shtsht',
			prams:{gitHash:123156456456}
			actionType: 'getDockerManifest'
		}
		start*: ({hash})=>axios.get(hash))
	}
}

const reducer = {

	promises:{
		[getCloudRunConfig.start]:(state, action)=>{..state, {}},
		[getCloudRunConfig.start]:(state, action)=>{..state, {}}
		[getCloudRunConfig.start]:(state, action)=>{..state, {}}
	}

	
}

const state = {
	deploys:[
		{id:2131, params:{pr,serveice}, currentStep:'created'},
		{id:2131, params:{pr,serveice}, currentStep:'checkCloudRunManifest.started'},
		{id:2131, params:{pr,serveice}, steps: {
			'getCloudRunConfig': { state: 'done', result: '' },
			'update expiresDate on tag': { state: 'started', childId:'121' }
			'checkCloudRunManifest'(): { state: 'pending', }
		},
	],
	runningPromises: [{
	    parentId:'2131',
		id:'121',
		prams: {gitHash:123156456456}
		actionType: 'getDockerManifest'
		state:'started'|'created'|'rejected'|'resolved',
		result:
		error:
		startedAt:
		createdAt:
		endedAt:
	}]


const actionPromiseCreator = (actionName, params:{hash:'121212', id:})=>{
	dispatch(actions[actionName].create(params))
		return ()=>{
			return dispatch(actions[actionName].start(params))
		}
	}


async.flow([
	'getCloudRunConfig',
	'update expiresDate on tag',
	'checkCloudRunManifest'(),
	'if run Build'(),
	'checkDockerRegistryManifest',
	'is shouldBuild'
].map(actionPromiseCreator))



actionPromiseCreator('getDockerManifest',{gitHash:123156456456})()
actionPromiseCreator('getDockerManifest',{gitHash:123156456456})


	runningTests:[{taskId:456456, testServer:'1'}]
	testServers:['1','2','3'],
	testserverqueue:[]
}
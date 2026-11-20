import {http,ApiError} from '../src/utils/request'
import {test,expect} from '@playwright/test'
import {weightError} from '../src/views/evaluation/utils/evaluator-design'
import {modelRefError,readModelRef,modelRefLabel} from '../src/views/evaluation/utils/evaluator-model'
import {createTaskComposite} from '../src/views/evaluation/utils/task-composite'
import type {EvaluatorSummary} from '../src/api/evaluations'
import { pinia } from '../src/stores';
import { useAuthStore } from '../src/stores/modules/auth';
import { useReviewStore } from '../src/stores/modules/review';
const items=[{id:'rule-a',kind:'rule',latest_version:'3',enabled:true},{id:'llm-b',kind:'llm_judge',latest_version:'7',enabled:true}] as EvaluatorSummary[]
test('model selection requires a valid provider/model and rejects credential values',()=>{
 for(const key of ['', '{}','null',JSON.stringify({provider_id:'p',model_id:''}),JSON.stringify({provider_id:'p',model_id:'m',credential_ref:'sk-example'})])expect(modelRefError(key)).not.toBe('')
 expect(modelRefError(JSON.stringify({provider_id:'p',model_id:'custom-model',credential_ref:'judge-team-ref'}))).toBe('')
})
test('model refs retain credential references without including unrelated fields',()=>{
 const key=JSON.stringify({provider_id:'p',model_id:'m',credential_ref:'ref',extra:'not a model property'})
 expect(readModelRef(key)).toEqual({provider_id:'p',model_id:'m',credential_ref:'ref'})
 expect(modelRefLabel(key)).toBe('m · p')
 expect(modelRefLabel('invalid')).toBe('未选择评审模型')
})
const originalAdapter=http.defaults.adapter
test.beforeEach(()=>{http.defaults.adapter=async()=>{throw Error('unexpected API call')}})
test.afterEach(()=>{http.defaults.adapter=originalAdapter})
test('weight validation rejects missing, negative, nonfinite and non-100 totals',()=>{
 for(const values of [[],[0,100],[-1,101],[NaN,50],[null,100],[30,30]])expect(weightError(values.map(weight=>({weight})))).not.toBe('')
 expect(weightError([{weight:33.33},{weight:66.67}])).toBe('')
})
test('task composite pins versions and sends normalized weights before publish/enable',async()=>{
 const calls:{url:string;method:string;body:any}[]=[]
 http.defaults.adapter=async config=>{calls.push({url:config.baseURL+config.url!,method:(config.method??'GET').toUpperCase(),body:JSON.parse(config.data??'{}')});return {data:calls.length===1?{evaluator:{id:'combo-id'}}:calls.length===2?{version:'1'}:{},status:200,statusText:'OK',headers:{},config}}
 expect(await createTaskComposite(items,{'rule-a':35,'llm-b':65},'测试组合')).toEqual({id:'combo-id',version:'1'})
 expect(calls.map(c=>[c.url,c.method])).toEqual([['/api/evaluators','POST'],['/api/evaluators/combo-id/drafts/publish','POST'],['/api/evaluators/combo-id','PATCH']])
 expect(calls[0].body.draft.children).toEqual([{evaluator_id:'rule-a',evaluator_version:'3',weight:.35},{evaluator_id:'llm-b',evaluator_version:'7',weight:.65}])
 expect(calls[2].body).toEqual({enabled:true})
})
test('invalid combination never writes API',async()=>{
 let count=0;http.defaults.adapter=async()=>{count++;throw Error('unexpected call')}
 await expect(createTaskComposite(items,{'rule-a':50,'llm-b':20},'bad')).rejects.toThrow('100%')
 await expect(createTaskComposite(items.slice(0,1),{'rule-a':100},'bad')).rejects.toThrow('至少')
 await expect(createTaskComposite([items[0],{...items[0],id:'rule-b'}],{'rule-a':50,'rule-b':50},'rules-only')).rejects.toThrow('规则和 LLM')
 await expect(createTaskComposite([{...items[0],enabled:false},items[1]],{'rule-a':50,'llm-b':50},'bad')).rejects.toThrow('已启用')
 expect(count).toBe(0)
})
test('publication failure reports created id without deleting the asset or enabling it',async()=>{
 let count=0;http.defaults.adapter=async config=>{count++;if(count>1)throw new ApiError(422,'invalid');return {data:{evaluator:{id:'pending-combo'}},status:200,statusText:'OK',headers:{},config}}
 await expect(createTaskComposite(items,{'rule-a':50,'llm-b':50},'test')).rejects.toThrow('pending-combo')
 expect(count).toBe(2)
})

test('evaluator reads discard previous identities and reload the legacy catalog for the current mode', async () => {
  const auth = useAuthStore(pinia);
  const originalAuth = { ...auth.$state };
  auth.loginBank('bank-token', 'bank-team', '行内团队');
  const review = useReviewStore(pinia);
  const calls: {
    path: string | undefined;
    headers: Record<string, unknown>;
    finish: (data: unknown) => void;
    fail: (cause: Error) => void;
  }[] = [];
  http.defaults.adapter = (config) => new Promise((resolve, reject) => {
    calls.push({
      path: config.url,
      headers: { ...config.headers },
      finish: data => resolve({ data, status: 200, statusText: 'OK', headers: {}, config }),
      fail: reject,
    });
  });
  const item = (id: string) => ({
    id, name: id, kind: 'llm_judge', source: 'user', enabled: true, latest_version: '1',
  });
  const detail = (id: string) => ({
    evaluator: item(id),
    latest: {
      kind: 'llm_judge', version: '1', dimension: 'answer', metric: 'quality',
      config: { instruction: id + ' prompt' },
    },
    draft: null,
  });
  const listPath = '/evaluators?include_disabled=true';
  try {
    const first = review.loadReviewAssets();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toMatchObject({ path: listPath, headers: { token: 'bank-token', 'X-Team-Id': 'bank-team' } });
    calls[0].finish([item('bank')]);
    await expect.poll(() => calls[1]?.path).toBe('/evaluators/bank');
    calls[1].finish(detail('bank'));
    await first;
    expect(review.extractedTemplates[0].instruction).toBe('bank prompt');
    review.scoringDrafts.push({ ...review.extractedTemplates[0], preview: true });

    const oldBankRefresh = review.loadReviewAssets();
    await expect.poll(() => calls[2]?.path).toBe(listPath);
    calls[2].finish([item('bank')]);
    await expect.poll(() => calls[3]?.path).toBe('/evaluators/bank');
    auth.logout();
    expect(review.evaluatorCatalog).toEqual([]);
    expect(review.evaluatorDetails).toEqual({});
    expect(review.extractedTemplates).toEqual([]);
    expect(review.scoringDrafts).toEqual([]);
    expect(review.assetsLoading).toBe(false);
    await review.loadReviewAssets();
    expect(calls).toHaveLength(4);

    auth.loginExternal();
    await expect.poll(() => calls[4]?.path).toBe(listPath);
    expect(calls[4].headers.token).toBeUndefined();
    expect(calls[4].headers['X-Team-Id']).toBeUndefined();
    calls[3].finish(detail('bank'));
    await oldBankRefresh;
    expect(review.evaluatorCatalog).toEqual([]);
    expect(review.evaluatorDetails).toEqual({});
    expect(review.extractedTemplates).toEqual([]);
    expect(review.assetsLoading).toBe(true);

    calls[4].finish([item('external')]);
    await expect.poll(() => calls[5]?.path).toBe('/evaluators/external');
    calls[5].finish(detail('external'));
    await expect.poll(() => review.extractedTemplates.map(template => template.instruction)).toEqual(['external prompt']);
    const oldExternalRefresh = review.loadReviewAssets();
    await expect.poll(() => calls[6]?.path).toBe(listPath);
    auth.initializePlatform({
      token: 'host-token', teamId: 'host-team', teamName: '集成团队', userId: 'host-user', userName: '集成用户',
    });
    expect(review.evaluatorCatalog).toEqual([]);
    await expect.poll(() => calls[7]?.path).toBe(listPath);
    expect(calls[7].headers).toMatchObject({ token: 'host-token', 'X-Team-Id': 'host-team', 'X-User-Id': 'host-user' });
    calls[6].finish([item('stale-external')]);
    await oldExternalRefresh;
    expect(calls).toHaveLength(8);
    expect(review.assetsLoading).toBe(true);
    calls[7].finish([item('integrated')]);
    await expect.poll(() => calls[8]?.path).toBe('/evaluators/integrated');
    calls[8].finish(detail('integrated'));
    await expect.poll(() => review.evaluatorCatalog.map(entry => entry.id)).toEqual(['integrated']);
    expect(Object.keys(review.evaluatorDetails)).toEqual(['integrated']);
    expect(review.extractedTemplates.map(template => template.instruction)).toEqual(['integrated prompt']);

    const oldIntegratedRefresh = review.loadReviewAssets();
    await expect.poll(() => calls[9]?.path).toBe(listPath);
    auth.loginBank('new-token', 'new-team', '另一个团队');
    await expect.poll(() => calls[10]?.path).toBe(listPath);
    expect(calls[10].headers).toMatchObject({ token: 'new-token', 'X-Team-Id': 'new-team' });
    calls[9].fail(Error('old request failed'));
    await oldIntegratedRefresh;
    expect(review.assetsError).toBe('');
    expect(review.assetsLoading).toBe(true);
    calls[10].finish([]);
    await expect.poll(() => review.assetsLoading).toBe(false);
    expect(calls).toHaveLength(11);
  } finally {
    review.$dispose();
    delete pinia.state.value[review.$id];
    auth.$patch(originalAuth);
  }
});

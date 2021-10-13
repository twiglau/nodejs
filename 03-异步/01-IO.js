/**
 * 1. Node异步I/O模型的基本要素:
 * > 事件循环
 * > 观察者
 * > 请求对象
 * > I/O 线程池
 * 
 * Windows 下主要通过 IOCP 来向系统内核发送I/O调用和从内核获取已完成的I/O操作,配已事件循环,
 * 以此来完成异步I/O的过程. 
 * 
 * 在Linux 下通过epoll 实现这个过程, FreeBSD下通过kqueue实现, Solaris下通过 Event ports
 * 实现. 不同的是线程池在 Windows下由内核 (IOCP) 直接提供, Linix 系列下由 libuv 自行实现.
 */